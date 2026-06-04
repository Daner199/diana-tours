<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SitioTuristicoController;
use App\Http\Controllers\PaqueteTuristicoController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\GrupoOperativoController;
use App\Http\Controllers\IncidenciaController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\GemeloDigitalController;

// =========================================================================
// RUTAS PÚBLICAS DE AUTENTICACIÓN
// =========================================================================
Route::prefix('auth')->group(function () {
    Route::post('/registro',             [AuthController::class, 'registro']);
    Route::post('/login',                [AuthController::class, 'login']);
    Route::post('/verificar-cuenta',     [AuthController::class, 'verificarCuenta']);
    Route::post('/verificar-2fa',        [AuthController::class, 'verificar2fa']);
    Route::post('/enviar-recuperacion',  [AuthController::class, 'enviarEnlaceRecuperacion']);
    Route::put('/auth/perfil',           [AuthController::class, 'actualizarPerfil']);
    Route::put('/auth/perfil/password',  [AuthController::class, 'cambiarPassword']);
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

// Módulo 7 — Gemelo Digital 360° (pública)
Route::get('/gemelo/{cod_sitio}/escenas', [GemeloDigitalController::class, 'index']);

// =========================================================================
// RUTAS PROTEGIDAS GENERALES (Usuarios autenticados)
// =========================================================================
Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout',      [AuthController::class, 'logout']);
    Route::get('/auth/perfil',       [AuthController::class, 'perfil']);
    Route::put('/auth/perfil/foto',  [AuthController::class, 'actualizarFoto']);

    // Reservas del turista
    Route::post('/reservas',                  [ReservaController::class, 'store']);
    Route::get('/mis-reservas',               [ReservaController::class, 'misReservas']);
    Route::patch('/reservas/{cod}/cancelar',  [ReservaController::class, 'cancelar']);

    // Voucher PDF
    Route::get('/reservas/{cod}/voucher', [ReservaController::class, 'generarVoucher']);

    // Módulo 7 — Métrica de inmersión 360°
    Route::post('/gemelo/metrica', [GemeloDigitalController::class, 'registrarMetrica']);
});

// =========================================================================
// RUTAS EXCLUSIVAS DEL ADMINISTRADOR
// =========================================================================
// =========================================================================
// RUTAS SOLO ADMINISTRADOR (gestión total del sistema)
// =========================================================================
Route::middleware(['auth:api', 'rol:Administrador'])->group(function () {
    // Usuarios — solo admin puede crear/editar/eliminar
    Route::post('/admin/usuarios',               [UsuariosController::class, 'store']);
    Route::put('/admin/usuarios/{cod}',          [UsuariosController::class, 'update']);
    Route::patch('/admin/usuarios/{cod}/estado', [UsuariosController::class, 'cambiarEstado']);
    Route::delete('/admin/usuarios/{cod}',       [UsuariosController::class, 'destroy']);

    // Sitios — solo admin puede modificar
    Route::post('/admin/sitios',         [SitioTuristicoController::class, 'store']);
    Route::put('/admin/sitios/{cod}',    [SitioTuristicoController::class, 'update']);
    Route::delete('/admin/sitios/{cod}', [SitioTuristicoController::class, 'destroy']);

    // Paquetes — solo admin puede modificar
    Route::post('/admin/paquetes',         [PaqueteTuristicoController::class, 'store']);
    Route::put('/admin/paquetes/{cod}',    [PaqueteTuristicoController::class, 'update']);
    Route::delete('/admin/paquetes/{cod}', [PaqueteTuristicoController::class, 'destroy']);

    // Grupos — solo admin puede crear/editar/eliminar/asignar
    Route::post('/admin/grupos',                          [GrupoOperativoController::class, 'store']);
    Route::put('/admin/grupos/{cod}',                     [GrupoOperativoController::class, 'update']);
    Route::delete('/admin/grupos/{cod}',                  [GrupoOperativoController::class, 'destroy']);
    Route::post('/admin/grupos/{cod}/asignar-guia',       [GrupoOperativoController::class, 'asignarGuia']);
    Route::post('/admin/grupos/{cod}/asignar-transporte', [GrupoOperativoController::class, 'asignarTransporte']);

    // Gemelo Digital — solo admin puede crear/editar/eliminar
    Route::post('/admin/gemelo/escenas',              [GemeloDigitalController::class, 'store']);
    Route::put('/admin/gemelo/escenas/{cod}',         [GemeloDigitalController::class, 'update']);
    Route::delete('/admin/gemelo/escenas/{cod}',      [GemeloDigitalController::class, 'destroy']);
    Route::post('/admin/gemelo/hotspots',             [GemeloDigitalController::class, 'storeHotspot']);
    Route::put('/admin/gemelo/hotspots/{cod}',        [GemeloDigitalController::class, 'updateHotspot']);
    Route::delete('/admin/gemelo/hotspots/{cod}',     [GemeloDigitalController::class, 'deleteHotspot']);
});

// =========================================================================
// RUTAS ADMINISTRADOR + OFICINISTA (operaciones diarias compartidas)
// =========================================================================
Route::middleware(['auth:api', 'rol:Administrador,Oficinista'])->group(function () {
    // Consultas de usuarios y roles
    Route::get('/admin/usuarios',    [UsuariosController::class, 'index']);
    Route::get('/admin/roles',       [UsuariosController::class, 'roles']);
    Route::get('/admin/estadisticas',[UsuariosController::class, 'estadisticas']);
    Route::get('/admin/mapa-operaciones', [UsuariosController::class, 'mapaOperaciones']);

    // Sitios y paquetes — lectura
    Route::get('/admin/sitios',    [SitioTuristicoController::class, 'indexAdmin']);
    Route::get('/admin/paquetes',  [PaqueteTuristicoController::class, 'indexAdmin']);

    // Reservas — ver y cambiar estado
    Route::get('/admin/reservas',                [ReservaController::class, 'indexAdmin']);
    Route::patch('/admin/reservas/{cod}/estado', [ReservaController::class, 'cambiarEstado']);

    // Grupos — solo lectura + pasajeros
    Route::get('/admin/grupos',              [GrupoOperativoController::class, 'index']);
    Route::get('/admin/grupos/{cod}/pasajeros', [GrupoOperativoController::class, 'pasajeros']);
    Route::get('/admin/incidencias/{cod_grupo}', [IncidenciaController::class, 'index']);

    // Gemelo Digital — solo lectura
    Route::get('/admin/gemelo/{cod_sitio}/escenas', [GemeloDigitalController::class, 'indexAdmin']);

    // Caja Diaria — acceso completo para ambos roles
    Route::get('/admin/caja/estado-hoy',    [CajaController::class, 'estadoHoy']);
    Route::get('/admin/caja/transacciones', [CajaController::class, 'transaccionesHoy']);
    Route::post('/admin/caja/abrir',        [CajaController::class, 'abrir']);
    Route::post('/admin/caja/cerrar/{cod}', [CajaController::class, 'cerrar']);
    Route::post('/admin/caja/ingreso',      [CajaController::class, 'registrarIngreso']);
    Route::post('/admin/caja/egreso',       [CajaController::class, 'registrarEgreso']);
    Route::get('/admin/caja/reporte',       [CajaController::class, 'reporte']);
});

// =========================================================================
// RUTAS EXCLUSIVAS DEL GUÍA TURÍSTICO
// =========================================================================
Route::middleware(['auth:api', 'rol:Guía Turístico'])->group(function () {
    Route::get('/guia/mis-tours-hoy',   [GrupoOperativoController::class, 'misTourshoy']);
    Route::post('/guia/incidencias',    [IncidenciaController::class, 'store']);
});
