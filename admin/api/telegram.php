<?php
/**
 * Налаштування Telegram-сповіщень.
 * Файл telegram-config.php виконується PHP і не віддається браузеру як JSON.
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth-helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

pdtRequireAdmin();

$configFile = __DIR__ . '/telegram-config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $config = file_exists($configFile) ? include $configFile : [];
    echo json_encode([
        'configured' => is_array($config) && !empty($config['token']) && !empty($config['chatId']),
        'chatId' => is_array($config) ? ($config['chatId'] ?? '') : ''
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Тільки GET та POST запити дозволені']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$token = trim((string) ($payload['token'] ?? ''));
$chatId = trim((string) ($payload['chatId'] ?? ''));

if ($token === '' || $chatId === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Вкажіть токен та Chat ID']);
    exit;
}

if (!preg_match('/^\d{5,}:[A-Za-z0-9_-]{20,}$/', $token)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Токен має некоректний формат']);
    exit;
}

$php = "<?php\n// Автоматично створено адмін-панеллю. Не завантажуйте цей файл у публічні репозиторії.\nreturn "
     . var_export(['token' => $token, 'chatId' => $chatId], true) . ";\n";

if (file_put_contents($configFile, $php, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Не вдалося записати налаштування. Перевірте права на папку admin/api/.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Telegram налаштовано'], JSON_UNESCAPED_UNICODE);
