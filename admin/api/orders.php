<?php
/**
 * API для обробки та збереження заявок клієнтів
 * Зберігає заявки у data/orders.json та опціонально шле сповіщення в Telegram
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth-helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$ordersFile = __DIR__ . '/../../data/orders.json';
$telegramConfigFile = __DIR__ . '/telegram-config.php';

// Ініціалізація файлу, якщо не існує
if (!file_exists($ordersFile)) {
    file_put_contents($ordersFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// 1. Отримання списку заявок (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    pdtRequireAdmin();
    $data = file_get_contents($ordersFile);
    echo $data ? $data : '[]';
    exit;
}

// 2. Обробка POST запитів (Нова заявка, оновлення статусу, видалення)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Некоректні дані']);
        exit;
    }

    $orders = json_decode(file_get_contents($ordersFile), true) ?: [];

    // Дія: Зміна статусу заявки
    if (isset($payload['action']) && $payload['action'] === 'update_status') {
        pdtRequireAdmin();
        $orderId = $payload['id'] ?? '';
        $newStatus = $payload['status'] ?? 'new';
        $allowedStatuses = ['new', 'in_progress', 'done', 'cancelled'];
        if (!in_array($newStatus, $allowedStatuses, true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Некоректний статус']);
            exit;
        }
        $found = false;

        foreach ($orders as &$ord) {
            if ($ord['id'] === $orderId) {
                $ord['status'] = $newStatus;
                $found = true;
                break;
            }
        }

        if ($found) {
            file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['success' => true, 'message' => 'Статус оновлено']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Заявку не знайдено']);
        }
        exit;
    }

    // Дія: Видалення заявки
    if (isset($payload['action']) && $payload['action'] === 'delete') {
        pdtRequireAdmin();
        $orderId = $payload['id'] ?? '';
        $orders = array_values(array_filter($orders, function($ord) use ($orderId) {
            return $ord['id'] !== $orderId;
        }));

        file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Заявку видалено']);
        exit;
    }

    // Дія: Створення нової заявки з сайту
    $phone = cleanOrderValue($payload['phone'] ?? '', 40);
    if ($phone === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Вкажіть номер телефону']);
        exit;
    }

    $email = cleanOrderValue($payload['email'] ?? '', 120);

    $newOrder = [
        'id' => 'ORD-' . strtoupper(substr(uniqid(), -5)),
        'createdAt' => date('Y-m-d H:i:s'),
        'name' => cleanOrderValue($payload['name'] ?? 'Клієнт', 120),
        'phone' => $phone,
        'email' => $email,
        'service' => cleanOrderValue($payload['service'] ?? 'Консультація', 180),
        'objectType' => cleanOrderValue($payload['objectType'] ?? 'Не вказано', 180),
        'address' => cleanOrderValue($payload['address'] ?? '', 240),
        'notes' => cleanOrderValue($payload['notes'] ?? '', 1000),
        'status' => 'new'
    ];

    // Додаємо нову заявку на початок списку
    array_unshift($orders, $newOrder);
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Токен зберігається лише у PHP-файлі, не у публічному content.json.
    if (file_exists($telegramConfigFile)) {
        $tg = include $telegramConfigFile;
        if (is_array($tg) && !empty($tg['token']) && !empty($tg['chatId'])) {
            $text = "🚨 НОВА ЗАЯВКА З САЙТУ\n\n"
                  . "👤 Ім'я: " . $newOrder['name'] . "\n"
                  . "📞 Телефон: " . $newOrder['phone'] . "\n"
                  . ($newOrder['email'] ? "✉️ Email: " . $newOrder['email'] . "\n" : "")
                  . "🛠 Послуга: " . $newOrder['service'] . "\n"
                  . "🏢 Об'єкт: " . $newOrder['objectType'] . "\n"
                  . "📍 Адреса: " . ($newOrder['address'] ?: 'Не вказано') . "\n"
                  . ($newOrder['notes'] ? "📝 Деталі: " . $newOrder['notes'] . "\n" : "")
                  . "🕒 Час: " . $newOrder['createdAt'];
            sendTelegramNotification($tg, $text);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Заявка успішно прийнята',
        'order' => $newOrder
    ]);
    exit;
}

function cleanOrderValue($value, $limit) {
    $value = trim(strip_tags((string) $value));
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit, 'UTF-8') : substr($value, 0, $limit);
}

function sendTelegramNotification($telegram, $text) {
    $url = 'https://api.telegram.org/bot' . rawurlencode($telegram['token']) . '/sendMessage';
    $params = ['chat_id' => $telegram['chatId'], 'text' => $text, 'disable_web_page_preview' => true];

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8
        ]);
        curl_exec($curl);
        curl_close($curl);
        return;
    }

    @file_get_contents($url . '?' . http_build_query($params));
}
