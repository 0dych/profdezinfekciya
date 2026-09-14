<?php
/** Спільна серверна авторизація для адмін-API. */

function pdtStartSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('pdt_admin_session');
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Strict',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
        ]);
        session_start();
    }
}

function pdtRequireAdmin() {
    pdtStartSession();
    if (empty($_SESSION['pdt_admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Потрібна авторизація адміністратора'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
