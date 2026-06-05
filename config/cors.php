<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 👇 AQUÍ ESTÁ EL ÚNICO CAMBIO (El puerto de tu React)
   'allowed_origins' => [
    'http://localhost:5173',
    'http://192.168.100.24',
    'http://localhost',
    'https://diana-tours-frontend.onrender.com',
],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
