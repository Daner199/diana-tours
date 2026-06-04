<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Rol;
use App\Models\Reserva;
use App\Models\SitioTuristico;
use App\Models\GrupoOperativo;
use App\Models\CajaDiaria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UsuariosController extends Controller
{
    public function index()
    {
        $usuarios = User::with('rol')
            ->orderBy('cod', 'desc')
            ->get()
            ->map(function ($u) {
                return [
                    'cod'              => $u->cod,
                    'nombre'           => $u->nombre,
                    'apellido_paterno' => $u->apellido_paterno,
                    'apellido_materno' => $u->apellido_materno,
                    'email'            => $u->email,
                    'telefono'         => $u->telefono,
                    'estado'           => $u->estado,
                    'foto_perfil'      => $u->foto_perfil,
                    'fecha_registro'   => $u->fecha_registro,
                    'cod_rol'          => $u->cod_rol,
                    'rol'              => $u->rol?->nombre,
                ];
            });

        return response()->json($usuarios);
    }

    public function roles()
    {
        return response()->json(Rol::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'           => 'required|string|max:50',
            'apellido_paterno' => 'required|string|max:50',
            'apellido_materno' => 'nullable|string|max:50',
            'email'            => 'required|email|unique:usuarios,email',
            'password'         => 'required|string|min:8',
            'cod_rol'          => 'required|exists:roles,cod',
            'telefono'         => 'nullable|string|max:20',
            'estado'           => 'nullable|in:activo,inactivo,bloqueado',
        ]);

        $user = User::create([
            'nombre'           => $request->nombre,
            'apellido_paterno' => $request->apellido_paterno,
            'apellido_materno' => $request->apellido_materno,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'cod_rol'          => $request->cod_rol,
            'telefono'         => $request->telefono,
            'estado'           => $request->estado ?? 'activo',
        ]);

        return response()->json(['mensaje' => 'Usuario creado correctamente.', 'usuario' => $user->load('rol')], 201);
    }

    public function update(Request $request, $cod)
    {
        $user = User::find($cod);
        if (!$user) return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);

        $request->validate([
            'nombre'           => 'sometimes|string|max:50',
            'apellido_paterno' => 'sometimes|string|max:50',
            'apellido_materno' => 'nullable|string|max:50',
            'email'            => 'sometimes|email|unique:usuarios,email,' . $cod . ',cod',
            'password'         => 'nullable|string|min:8',
            'cod_rol'          => 'sometimes|exists:roles,cod',
            'telefono'         => 'nullable|string|max:20',
            'estado'           => 'nullable|in:activo,inactivo,bloqueado',
        ]);

        $datos = $request->only(['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'cod_rol', 'telefono', 'estado']);
        if ($request->filled('password')) $datos['password'] = Hash::make($request->password);
        $user->update($datos);

        return response()->json(['mensaje' => 'Usuario actualizado.', 'usuario' => $user->load('rol')]);
    }

    public function cambiarEstado(Request $request, $cod)
    {
        $user = User::find($cod);
        if (!$user) return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        $request->validate(['estado' => 'required|in:activo,inactivo,bloqueado']);
        $user->estado = $request->estado;
        $user->save();
        return response()->json(['mensaje' => 'Estado actualizado.']);
    }

    public function destroy($cod)
    {
        $user = User::find($cod);
        if (!$user) return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        $user->delete();
        return response()->json(['mensaje' => 'Usuario eliminado.']);
    }

    // =========================================================================
    // ESTADÍSTICAS AMPLIADAS PARA DASHBOARD M6
    // =========================================================================
    public function estadisticas()
    {
        // ── Usuarios ──────────────────────────────────────────────────────────
        $totalUsuarios    = User::count();
        $totalAdmins      = User::where('cod_rol', 1)->count();
        $totalGuias       = User::where('cod_rol', 2)->count();
        $totalTuristas    = User::where('cod_rol', 3)->count();
        $totalOficinistas = User::where('cod_rol', 4)->count();

        // ── Catálogo ──────────────────────────────────────────────────────────
        $totalSitios   = SitioTuristico::where('estado', 'activo')->count();
        $totalPaquetes = \App\Models\PaqueteTuristico::where('estado', 'activo')->count();

        // ── Reservas por estado ───────────────────────────────────────────────
        $reservasPorEstado = Reserva::select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get()
            ->mapWithKeys(fn($r) => [$r->estado => (int) $r->total]);

        // ── Ventas por mes (últimos 6 meses) ──────────────────────────────────
        $ventasPorMes = DB::table('reservas')
            ->join('pagos', 'pagos.cod_reserva', '=', 'reservas.cod')
            ->whereIn('reservas.estado', ['confirmada', 'completada'])
            ->where('reservas.fecha_reserva', '>=', Carbon::now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw("TO_CHAR(reservas.fecha_reserva, 'Mon') as mes"),
                DB::raw("TO_CHAR(reservas.fecha_reserva, 'YYYY-MM') as mes_orden"),
                DB::raw('SUM(pagos.monto_pagado) as total_bs'),
                DB::raw('COUNT(reservas.cod) as cantidad')
            )
            ->groupBy('mes', 'mes_orden')
            ->orderBy('mes_orden')
            ->get();

        // ── Ingresos del día (caja abierta hoy) ───────────────────────────────
        $cajaHoy = CajaDiaria::whereDate('fecha_apertura', now()->toDateString())
            ->where('estado', 'abierta')
            ->first();

        $ingresosHoy = $cajaHoy ? $cajaHoy->totalIngresos() : 0;
        $saldoCajaHoy = $cajaHoy ? $cajaHoy->saldoActual() : 0;

        // ── Paquetes más populares (top 5) ────────────────────────────────────
        $paquetesPopulares = DB::table('reservas')
            ->join('paquetes_turisticos', 'paquetes_turisticos.cod', '=', 'reservas.cod_paquete')
            ->select(
                'paquetes_turisticos.cod',
                'paquetes_turisticos.nombre',
                DB::raw('COUNT(reservas.cod) as total_reservas'),
                DB::raw('SUM(reservas.cantidad_pasajeros) as total_pasajeros')
            )
            ->groupBy('paquetes_turisticos.cod', 'paquetes_turisticos.nombre')
            ->orderByDesc('total_reservas')
            ->limit(5)
            ->get();

        // ── Grupos operativos hoy ─────────────────────────────────────────────
        $gruposHoy = GrupoOperativo::whereDate('fecha_salida', now()->toDateString())
            ->whereIn('estado', ['confirmado', 'en_curso'])
            ->count();

        // ── Métodos de pago (distribución) ────────────────────────────────────
        $metodosPago = DB::table('pagos')
            ->select(DB::raw("
                CASE
                    WHEN metodo_pago LIKE '%tarjeta%' THEN 'Tarjeta'
                    WHEN metodo_pago LIKE '%qr%'      THEN 'QR'
                    ELSE 'Efectivo'
                END as metodo,
                COUNT(*) as total
            "))
            ->groupBy(DB::raw("
                CASE
                    WHEN metodo_pago LIKE '%tarjeta%' THEN 'Tarjeta'
                    WHEN metodo_pago LIKE '%qr%'      THEN 'QR'
                    ELSE 'Efectivo'
                END
            "))
            ->get();

        return response()->json([
            // Usuarios
            'total_usuarios'    => $totalUsuarios,
            'total_admins'      => $totalAdmins,
            'total_guias'       => $totalGuias,
            'total_turistas'    => $totalTuristas,
            'total_oficinistas' => $totalOficinistas,
            // Catálogo
            'total_sitios'      => $totalSitios,
            'total_paquetes'    => $totalPaquetes,
            // Reservas
            'reservas_por_estado' => $reservasPorEstado,
            'total_reservas'      => Reserva::count(),
            // Ventas
            'ventas_por_mes'      => $ventasPorMes,
            // Caja
            'ingresos_hoy'        => $ingresosHoy,
            'saldo_caja_hoy'      => $saldoCajaHoy,
            'caja_abierta'        => $cajaHoy !== null,
            // Operaciones
            'grupos_hoy'          => $gruposHoy,
            'paquetes_populares'  => $paquetesPopulares,
            'metodos_pago'        => $metodosPago,
        ]);
    }

    // =========================================================================
    // MAPA DE OPERACIONES — sitios activos con coords + grupos del día
    // =========================================================================
    public function mapaOperaciones()
    {
        $sitios = SitioTuristico::where('estado', 'activo')
            ->whereNotNull('latitud')
            ->whereNotNull('longitud')
            ->get()
            ->map(fn($s) => [
                'cod'       => $s->cod,
                'nombre'    => $s->nombre,
                'latitud'   => (float) $s->latitud,
                'longitud'  => (float) $s->longitud,
                'foto'      => $s->foto,
            ]);

        $gruposHoy = GrupoOperativo::with(['paquete:cod,nombre', 'asignacion'])
            ->whereDate('fecha_salida', now()->toDateString())
            ->whereIn('estado', ['confirmado', 'en_curso', 'planificacion'])
            ->get()
            ->map(fn($g) => [
                'cod'          => $g->cod,
                'paquete'      => $g->paquete?->nombre,
                'estado'       => $g->estado,
                'fecha_salida' => $g->fecha_salida,
                'guia'         => $g->asignacion?->cod_guia,
            ]);

        return response()->json([
            'sitios'      => $sitios,
            'grupos_hoy'  => $gruposHoy,
        ]);
    }
}
