<?php
// Credentials belong in hosting environment variables or a file outside the web root.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
umask(0077);

function reply(int $code, bool $ok, array $extra = []): void {
    http_response_code($code);
    echo json_encode(array_merge(['ok' => $ok], $extra));
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
foreach (['name', 'phone', 'interest', 'page', 'website', 'request_id', 'source'] as $field) {
    if (isset($input[$field]) && !is_string($input[$field])) reply(422, false);
}
if (!empty($input['website'])) reply(200, true, ['accepted' => false]);
$rawName = $input['name'] ?? '';
$name = trim($rawName);
$phone = trim($input['phone'] ?? '');
$interest = trim($input['interest'] ?? 'Заявка с сайта');
$page = $input['page'] ?? '/';
$source = $input['source'] ?? 'popup';
$requestId = $input['request_id'] ?? bin2hex(random_bytes(16));
if (!preg_match('/\A[a-f0-9]{32}\z/', $requestId) || !preg_match('/\A[a-z0-9-]{1,60}\z/', $source)) reply(422, false);
// Allow names as text only. Reject markup and control characters even without JavaScript.
if (preg_match('/[\x00-\x1f\x7f]/', $rawName) || !preg_match('//u', $rawName)) reply(422, false);
$name = str_replace(['’', '‘', 'ʼ', '‐', '‑'], ["'", "'", "'", '-', '-'], $name);
$name = preg_replace('/\p{Zs}+/u', ' ', $name);
$name = trim(preg_replace("/ *([-']) */u", '$1', $name));
if (class_exists('Normalizer')) $name = Normalizer::normalize($name, Normalizer::FORM_C);
if (!preg_match("/\A(?=.{2,80}\z)\p{L}[\p{L}\p{M}]*(?:[ '-]\p{L}[\p{L}\p{M}]*)*\z/u", $name)) reply(422, false);
if (!preg_match('/\A\+?[0-9 ()-]{7,30}\z/', $phone)) reply(422, false);
$digits = preg_replace('/\D/', '', $phone);
if (strlen($digits) === 14 && substr($digits, 0, 5) === '00375' && $phone[0] !== '+') $digits = substr($digits, 2);
elseif (strlen($digits) === 11 && substr($digits, 0, 2) === '80' && $phone[0] !== '+') $digits = '375' . substr($digits, 2);
elseif (strlen($digits) === 9 && $phone[0] !== '+') $digits = '375' . $digits;
if (!preg_match('/\A375[1-9]\d{8}\z/', $digits) || ($input['consent'] ?? false) !== true) reply(422, false);
$phone = '+375 ' . substr($digits, 3, 2) . ' ' . substr($digits, 5, 3) . '-' . substr($digits, 8, 2) . '-' . substr($digits, 10, 2);
if (strlen($interest) > 1000 || !preg_match('/^\/[^\s?#\x00-\x1f]{0,300}$/u', $page)) reply(422, false);

$configPath = getenv('VERTO_LEAD_CONFIG') ?: dirname(__DIR__) . '/verto-private/telegram.php';
$config = [];
if (is_file($configPath)) {
    try { $config = require $configPath; } catch (Throwable $error) { reply(503, false); }
    if (!is_array($config)) reply(503, false);
}
$token = getenv('VERTO_TELEGRAM_BOT_TOKEN') ?: ($config['token'] ?? '');
$chat = getenv('VERTO_TELEGRAM_CHAT_ID') ?: ($config['chat_id'] ?? '436390507');
$configured = is_string($token) && preg_match('/^\d+:[A-Za-z0-9_-]+$/', $token) && preg_match('/^-?\d+$/', (string)$chat);

// Limit requests using an IP hash, without storing phone numbers or message bodies.
$rateDir = getenv('VERTO_LEAD_RATE_DIR') ?: dirname($configPath) . '/rate-limit';
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

// Save every accepted lead before contacting Telegram. This directory must be private.
$leadDir = getenv('VERTO_LEAD_STORAGE_DIR') ?: dirname($configPath) . '/leads';
if (!is_dir($leadDir) && !@mkdir($leadDir, 0700, true) && !is_dir($leadDir)) reply(503, false);
$leadDir = realpath($leadDir);
$publicDir = realpath(__DIR__);
if ($leadDir === false || $publicDir === false || $leadDir === $publicDir || strpos($leadDir, $publicDir . DIRECTORY_SEPARATOR) === 0 || !@chmod($leadDir, 0700)) reply(503, false);
$leadPath = $leadDir . '/' . $requestId . '.json';
// A stable request ID prevents a timeout/retry from sending the same lead twice.
$lock = @fopen($leadDir . '/' . $requestId . '.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) reply(503, false);
$fingerprint = hash('sha256', json_encode([$name, $phone, $interest, $page, $source], JSON_UNESCAPED_UNICODE));
if (is_file($leadPath)) {
    $previous = json_decode((string)@file_get_contents($leadPath), true);
    if (!is_array($previous) || !isset($previous['fingerprint'])) reply(503, false);
    if (!hash_equals($previous['fingerprint'], $fingerprint)) reply(409, false);
    $delivered = ($previous['delivery']['status'] ?? '') === 'sent';
    reply($delivered ? 200 : 202, true, ['accepted' => true, 'id' => $requestId, 'delivered' => $delivered]);
}
function saveLead(string $path, array $record): bool {
    $json = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temp = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    $written = @file_put_contents($temp, $json, LOCK_EX);
    if ($written !== strlen($json) || !@chmod($temp, 0600) || !@rename($temp, $path)) {
        @unlink($temp);
        return false;
    }
    return true;
}
$record = [
    'id' => $requestId,
    'created_at' => gmdate('c'),
    'name' => $name,
    'phone' => $phone,
    'interest' => $interest,
    'page' => $page,
    'source' => $source,
    'consent' => true,
    'fingerprint' => $fingerprint,
    'delivery' => ['status' => 'pending'],
];
if (!saveLead($leadPath, $record)) reply(503, false);

$text = "Новая заявка с verto.by\n\nИмя: " . $name . "\nТелефон: " . $phone . "\nЗадача: " . $interest . "\nСтраница: " . $page . "\nНомер заявки: " . $requestId;
$body = json_encode(['chat_id' => (string)$chat, 'text' => $text, 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);
$delivered = false;
$record['delivery'] = ['status' => 'failed', 'attempted_at' => gmdate('c'), 'reason' => $configured ? 'telegram_unavailable' : 'not_configured'];
if ($configured) {
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    try {
        $code = 0;
        if (function_exists('curl_init')) {
            $curl = curl_init($url);
            curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 10]);
            $response = curl_exec($curl);
            $code = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
        } else {
            $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => 10, 'ignore_errors' => true]]);
            $response = @file_get_contents($url, false, $context);
        }
        $result = is_string($response) ? json_decode($response, true) : null;
        $delivered = is_array($result) && ($result['ok'] ?? false) === true;
        if ($delivered) {
            $record['delivery'] = ['status' => 'sent', 'sent_at' => gmdate('c'), 'message_id' => $result['result']['message_id'] ?? null];
        } elseif ($code > 0) {
            $record['delivery']['http_status'] = $code;
        }
    } catch (Throwable $error) {
        // Never return or log the request URL or exception: they can contain the bot token.
    }
}
// If this update fails, the original pending record still contains the complete lead.
if (!saveLead($leadPath, $record)) $delivered = false;
flock($lock, LOCK_UN); fclose($lock);
// Acceptance means a durable private copy exists, including when Telegram is unavailable.
reply($delivered ? 200 : 202, true, ['accepted' => true, 'id' => $requestId, 'delivered' => $delivered]);
