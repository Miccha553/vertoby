<?php
// Credentials belong in hosting environment variables or a file outside the web root.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $code, bool $ok): void {
    http_response_code($code);
    echo json_encode(['ok' => $ok]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, false);
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) reply(415, false);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) reply(413, false);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '')) reply(403, false);
$raw = file_get_contents('php://input', false, null, 0, 8193);
if ($raw === false || strlen($raw) > 8192) reply(413, false);
$input = json_decode($raw, true);
if (!is_array($input)) reply(400, false);
foreach (['name', 'phone', 'interest', 'page', 'website'] as $field) {
    if (isset($input[$field]) && !is_string($input[$field])) reply(422, false);
}
if (!empty($input['website'])) reply(200, true);
$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$interest = trim($input['interest'] ?? 'Заявка с сайта');
$page = $input['page'] ?? '/';
if (!preg_match('/^.{2,80}$/u', $name) || preg_match('/[\x00-\x1f\x7f]/u', $name)) reply(422, false);
if (!preg_match('/^\+[1-9]\d{6,14}$/', $phone) || ($input['consent'] ?? false) !== true) reply(422, false);
if (strlen($interest) > 1000 || !preg_match('/^\/[^\s?#\x00-\x1f]{0,300}$/u', $page)) reply(422, false);

$configPath = getenv('VERTO_LEAD_CONFIG') ?: dirname(__DIR__) . '/verto-private/telegram.php';
$config = [];
if (is_file($configPath)) {
    try { $config = require $configPath; } catch (Throwable $error) { reply(503, false); }
    if (!is_array($config)) reply(503, false);
}
$token = getenv('VERTO_TELEGRAM_BOT_TOKEN') ?: ($config['token'] ?? '');
$chat = getenv('VERTO_TELEGRAM_CHAT_ID') ?: ($config['chat_id'] ?? '436390507');
if (!is_string($token) || !preg_match('/^\d+:[A-Za-z0-9_-]+$/', $token) || !preg_match('/^-?\d+$/', (string)$chat)) reply(503, false);

// Limit requests using an IP hash, without storing phone numbers or message bodies.
$rateDir = sys_get_temp_dir() . '/verto-leads-' . substr(hash('sha256', __DIR__), 0, 12);
if (!is_dir($rateDir) && !@mkdir($rateDir, 0700, true) && !is_dir($rateDir)) reply(503, false);
$rateFile = $rateDir . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
$handle = @fopen($rateFile, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) reply(503, false);
$attempts = json_decode(stream_get_contents($handle), true);
$now = time();
$attempts = is_array($attempts) ? array_values(array_filter($attempts, static function ($t) use ($now) { return is_int($t) && $t > $now - 600; })) : [];
if (count($attempts) >= 5) {
    flock($handle, LOCK_UN); fclose($handle);
    header('Retry-After: 600'); reply(429, false);
}
$attempts[] = $now;
ftruncate($handle, 0); rewind($handle); fwrite($handle, json_encode($attempts));
flock($handle, LOCK_UN); fclose($handle);

$text = "Новая заявка с verto.by\n\nИмя: " . $name . "\nТелефон: " . $phone . "\nЗадача: " . $interest . "\nСтраница: " . $page;
$body = json_encode(['chat_id' => (string)$chat, 'text' => $text, 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);
$url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
try {
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 10]);
        $response = curl_exec($curl);
        $code = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($code !== 200) reply(502, false);
    } else {
        $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => 10, 'ignore_errors' => true]]);
        $response = @file_get_contents($url, false, $context);
    }
    $result = is_string($response) ? json_decode($response, true) : null;
    if (!is_array($result) || ($result['ok'] ?? false) !== true) reply(502, false);
} catch (Throwable $error) {
    // Never return or log the request URL: it contains the bot token.
    reply(502, false);
}
reply(200, true);
