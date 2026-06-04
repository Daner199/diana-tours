<?php

namespace App\Http\Controllers;

use App\Models\GrupoOperativo;
use App\Models\AsignacionLogistica;
use App\Models\User;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class GrupoOperativoController extends Controller
{
    // ===== LISTAR TODOS LOS GRUPOS =====
    public function index()
    {
        $grupos = GrupoOperativo::with(['paquete:cod,nombre,foto_principal', 'asignacion.guia'])
            ->orderBy('fecha_salida', 'desc')
            ->get()
            ->map(fn($g) => $this->formatearGrupo($g));

        return response()->json($grupos);
    }

    // ===== CREAR GRUPO =====
    public function store(Request $request)
    {
        $request->validate([
            'cod_paquete'  => 'required|exists:paquetes_turisticos,cod',
            'fecha_salida' => 'required|date|after_or_equal:today',
            'aforo_minimo' => 'required|integer|min:1',
            'aforo_maximo' => 'required|integer|gte:aforo_minimo',
        ]);

        DB::beginTransaction();
        try {
            $grupo = GrupoOperativo::create([
                'cod_paquete'  => $request->cod_paquete,
                'fecha_salida' => $request->fecha_salida,
                'aforo_minimo' => $request->aforo_minimo,
                'aforo_maximo' => $request->aforo_maximo,
                'estado'       => 'planificacion',
            ]);
            DB::commit();
            return response()->json([
                'mensaje' => 'Grupo creado correctamente.',
                'grupo'   => $this->formatearGrupo($grupo->load(['paquete', 'asignacion.guia'])),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al crear el grupo.'], 500);
        }
    }

    // ===== ACTUALIZAR GRUPO =====
    public function update(Request $request, $cod)
    {
        $grupo = GrupoOperativo::find($cod);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        $request->validate([
            'fecha_salida' => 'sometimes|date',
            'aforo_minimo' => 'sometimes|integer|min:1',
            'aforo_maximo' => 'sometimes|integer|min:1',
            'estado'       => 'sometimes|in:planificacion,confirmado,en_curso,completado,cancelado',
        ]);

        $grupo->update($request->only(['fecha_salida', 'aforo_minimo', 'aforo_maximo', 'estado']));

        return response()->json([
            'mensaje' => 'Grupo actualizado.',
            'grupo'   => $this->formatearGrupo($grupo->load(['paquete', 'asignacion.guia'])),
        ]);
    }

    // ===== ELIMINAR GRUPO =====
    public function destroy($cod)
    {
        $grupo = GrupoOperativo::find($cod);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        if (in_array($grupo->estado, ['en_curso', 'completado'])) {
            return response()->json(['mensaje' => 'No se puede eliminar un grupo en curso o completado.'], 422);
        }

        $grupo->delete();
        return response()->json(['mensaje' => 'Grupo eliminado correctamente.']);
    }

    // ===== ASIGNAR GUÍA =====
    public function asignarGuia(Request $request, $cod)
    {
        $grupo = GrupoOperativo::find($cod);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        $request->validate([
            'cod_guia' => 'required|exists:usuarios,cod',
        ]);

        // Validar que el guía no tenga otro tour el mismo día
        $conflicto = AsignacionLogistica::whereHas('grupo', function ($q) use ($grupo, $request) {
            $q->where('fecha_salida', $grupo->fecha_salida)
              ->where('cod', '!=', $grupo->cod);
        })->where('cod_guia', $request->cod_guia)->exists();

        if ($conflicto) {
            return response()->json([
                'mensaje' => 'Este guía ya tiene un tour asignado para esa fecha.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            AsignacionLogistica::updateOrCreate(
                ['cod_grupo' => $grupo->cod],
                ['cod_guia'  => $request->cod_guia]
            );
            DB::commit();
            return response()->json(['mensaje' => 'Guía asignado correctamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al asignar el guía.'], 500);
        }
    }

    // ===== ASIGNAR TRANSPORTE =====
    public function asignarTransporte(Request $request, $cod)
    {
        $grupo = GrupoOperativo::find($cod);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        $request->validate([
    'placa_transporte'     => 'required|string|max:20',
    'capacidad_transporte' => 'required|integer|min:1',
]);

// Convertir explícitamente a entero antes de comparar
$capacidad = (int) $request->capacidad_transporte;

if ($capacidad < $grupo->aforo_maximo) {
    return response()->json([
        'mensaje' => "La capacidad del transporte ({$capacidad}) debe ser mayor o igual al aforo máximo del grupo ({$grupo->aforo_maximo})."
    ], 422);
}

DB::beginTransaction();
try {
    AsignacionLogistica::updateOrCreate(
        ['cod_grupo'            => $grupo->cod],
        [
            'placa_transporte'     => $request->placa_transporte,
            'capacidad_transporte' => $capacidad,  // <- usar la variable casteada
        ]
    );
    DB::commit();
    return response()->json(['mensaje' => 'Transporte asignado correctamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al asignar el transporte.'], 500);
        }
    }

    // ===== PASAJEROS DEL GRUPO =====
    public function pasajeros($cod)
    {
        $grupo = GrupoOperativo::find($cod);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        // Los pasajeros son los turistas con reservas confirmadas del mismo paquete y fecha
        $pasajeros = Reserva::with('turista:cod,nombre,apellido_paterno,apellido_materno,email,telefono,foto_perfil')
            ->where('cod_paquete', $grupo->cod_paquete)
            ->where('fecha_reserva', $grupo->fecha_salida)
            ->whereIn('estado', ['confirmada', 'completada'])
            ->get()
            ->map(fn($r) => [
                'cod_reserva'        => $r->cod,
                'cantidad_pasajeros' => $r->cantidad_pasajeros,
                'estado_reserva'     => $r->estado,
                'turista' => $r->turista ? [
                    'cod'            => $r->turista->cod,
                    'nombre_completo'=> trim("{$r->turista->nombre} {$r->turista->apellido_paterno} " . ($r->turista->apellido_materno ?? '')),
                    'email'          => $r->turista->email,
                    'telefono'       => $r->turista->telefono,
                    'foto_perfil'    => $r->turista->foto_perfil,
                ] : null,
            ]);

        return response()->json([
            'grupo'     => [
                'cod'          => $grupo->cod,
                'fecha_salida' => $grupo->fecha_salida,
                'paquete'      => $grupo->paquete->nombre ?? '—',
            ],
            'pasajeros' => $pasajeros,
            'total'     => $pasajeros->sum('cantidad_pasajeros'),
        ]);
    }

    // ===== HELPER PRIVADO =====
    private function formatearGrupo(GrupoOperativo $g): array
    {
        return [
            'cod'          => $g->cod,
            'fecha_salida' => $g->fecha_salida,
            'aforo_minimo' => $g->aforo_minimo,
            'aforo_maximo' => $g->aforo_maximo,
            'estado'       => $g->estado,
            'paquete' => $g->paquete ? [
                'cod'            => $g->paquete->cod,
                'nombre'         => $g->paquete->nombre,
                'foto_principal' => $g->paquete->foto_principal,
            ] : null,
            'asignacion' => $g->asignacion ? [
                'cod_guia'            => $g->asignacion->cod_guia,
                'nombre_guia'         => $g->asignacion->guia
                    ? trim("{$g->asignacion->guia->nombre} {$g->asignacion->guia->apellido_paterno}")
                    : null,
                'placa_transporte'    => $g->asignacion->placa_transporte,
                'capacidad_transporte'=> $g->asignacion->capacidad_transporte,
            ] : null,
        ];
    }
// ===== GUÍA: MIS TOURS DE HOY =====
public function misTourshoy()
{
    $user = JWTAuth::parseToken()->authenticate();
    $hoy   = now()->toDateString();
    $fin   = now()->addDays(30)->toDateString();

    $grupos = GrupoOperativo::with([
        'paquete:cod,nombre,foto_principal,duracion_horas',
        'asignacion',
        'incidencias',
    ])
    ->whereHas('asignacion', fn($q) => $q->where('cod_guia', $user->cod))
    ->whereBetween('fecha_salida', [$hoy, $fin])
    ->whereIn('estado', ['planificacion', 'confirmado', 'en_curso'])
    ->orderBy('fecha_salida', 'asc')
    ->get()
    ->map(function ($g) {
        $pasajeros = Reserva::with('turista:cod,nombre,apellido_paterno,telefono,foto_perfil')
            ->where('cod_paquete', $g->cod_paquete)
            ->where('fecha_reserva', $g->fecha_salida)
            ->whereIn('estado', ['confirmada', 'completada'])
            ->get()
            ->map(fn($r) => [
                'nombre_completo' => trim("{$r->turista->nombre} {$r->turista->apellido_paterno}"),
                'telefono'        => $r->turista->telefono,
                'foto_perfil'     => $r->turista->foto_perfil,
                'cantidad'        => $r->cantidad_pasajeros,
            ]);

        $esHoy = $g->fecha_salida === now()->toDateString();

        return [
            'cod'             => $g->cod,
            'estado'          => $g->estado,
            'fecha_salida'    => $g->fecha_salida,
            'es_hoy'          => $esHoy,
            'paquete'         => $g->paquete,
            'transporte'      => $g->asignacion ? [
                'placa'     => $g->asignacion->placa_transporte,
                'capacidad' => $g->asignacion->capacidad_transporte,
            ] : null,
            'pasajeros'       => $pasajeros,
            'total_pasajeros' => $pasajeros->sum('cantidad'),
            'incidencias_hoy' => $g->incidencias->count(),
        ];
    });

    return response()->json($grupos);
}
}
