<?php
// Початковий PIN: 1234. Увійдіть і відразу замініть його у вкладці «Безпека».
// Після зміни цей файл міститиме лише хеш, а не відкритий PIN.
return [
    'pin_hash' => password_hash('1234', PASSWORD_DEFAULT),
    'is_default' => true
];
