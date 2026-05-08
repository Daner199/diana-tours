<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SitioTuristicoController;
use App\Http\Controllers\PaqueteTuristicoController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\ReservaController;

// =========================================================================
// RUTAS PÚBLICAS DE AUTENTICACIÓN
// =========================================================================
Route::prefix('auth')->group(function () {
    Route::post('/registro',             [AuthController::class, 'registro']);
    Route::post('/login',                [AuthController::class, 'login']);
    Route::post('/verificar-cuenta',     [AuthController::class, 'verificarCuenta']);
    Route::post('/verificar-2fa',        [AuthController::class, 'verificar2fa']);
    Route::post('/enviar-recuperacion',  [AuthController::class, 'enviarEnlaceRecuperacion']);
    Route::post('/restablecer-password', [AuthController::class, 'restablecerPassword']);
});

// =========================================================================
// RUTAS PÚBLICAS DEL CATÁLOGO
// =========================================================================
Route::get('/tipo-cambio',    [ReservaController::class, 'tipoCambio']);
Route::get('/sitios',         [SitioTuristicoController::class, 'index']);
Route::get('/sitios/{cod}',   [SitioTuristicoController::class, 'show']);
Route::get('/paquetes',       [PaqueteTuristicoController::class, 'index']);
Route::get('/paquetes/{cod}', [PaqueteTuristicoController::class, 'show']);

// =========================================================================
// RUTAS PROTEGIDAS GENERALES
// =========================================================================
Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout',      [AuthController::class, 'logout']);
    Route::get('/auth/perfil',       [AuthController::class, 'perfil']);
    Route::put('/auth/perfil/foto',  [AuthController::class, 'actualizarFoto']);

    // Reservas del turista
    Route::post('/reservas',                  [ReservaController::class, 'store']);
    Route::get('/mis-reservas',               [ReservaController::class, 'misReservas']);
    Route::patch('/reservas/{cod}/cancelar',  [ReservaController::class, 'cancelar']);
});

// =========================================================================
// RUTAS EXCLUSIVAS DEL ADMINISTRADOR
// =========================================================================
Route::middleware(['auth:api', 'rol:Administrador'])->group(function () {
    Route::get('/admin/usuarios',                [UsuariosController::class, 'index']);
    Route::get('/admin/roles',                   [UsuariosController::class, 'roles']);
    Route::post('/admin/usuarios',               [UsuariosController::class, 'store']);
    Route::put('/admin/usuarios/{cod}',          [UsuariosController::class, 'update']);
    Route::patch('/admin/usuarios/{cod}/estado', [UsuariosController::class, 'cambiarEstado']);
    Route::delete('/admin/usuarios/{cod}',       [UsuariosController::class, 'destroy']);
    Route::get('/admin/estadisticas',            [UsuariosController::class, 'estadisticas']);

    Route::get('/admin/sitios',          [SitioTuristicoController::class, 'indexAdmin']);
    Route::post('/admin/sitios',         [SitioTuristicoController::class, 'store']);
    Route::put('/admin/sitios/{cod}',    [SitioTuristicoController::class, 'update']);
    Route::delete('/admin/sitios/{cod}', [SitioTuristicoController::class, 'destroy']);

    Route::get('/admin/paquetes',          [PaqueteTuristicoController::class, 'indexAdmin']);
    Route::post('/admin/paquetes',         [PaqueteTuristicoController::class, 'store']);
    Route::put('/admin/paquetes/{cod}',    [PaqueteTuristicoController::class, 'update']);
    Route::delete('/admin/paquetes/{cod}', [PaqueteTuristicoController::class, 'destroy']);
});
