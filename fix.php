<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$users = App\Models\User::all();
foreach($users as $u) {
    $u->password = Illuminate\Support\Facades\Hash::make('Patitofeo23*');
    $u->save();
    echo "Actualizado: " . $u->email . "\n";
}
echo "OK - " . $users->count() . " usuarios actualizados\n";
