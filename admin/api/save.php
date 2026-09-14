<?php
/**
 * PHP-ендпоінт для автоматичного збереження content.json з адмінки
 * Безпечний та швидкий плоский файловий бекенд (flat-file)
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth-helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Тільки POST запити дозволені']);
    exit;
}

pdtRequireAdmin();

// Отримання сирого JSON з тіла запиту
$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Порожні дані запиту']);
    exit;
}

// Перевірка валідності JSON
$decoded = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Некоректний JSON формат: ' . json_last_error_msg()]);
    exit;
}

// Секрети Telegram не мають потрапляти у публічний JSON конфігурації.
unset($decoded['telegramBot']);

// Шлях до цільового файлу даних
$targetFile = __DIR__ . '/../../data/content.json';

// Запис файлу з гарним форматуванням
$prettyJson = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if (file_put_contents($targetFile, $prettyJson, LOCK_EX) !== false) {
    echo json_encode([
        'success' => true,
        'message' => 'Дані успішно збережено у data/content.json',
        'updated_at' => date('Y-m-d H:i:s')
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Не вдалося записати файл на сервері. Перевірте права доступу до папки data/.'
    ]);
}
