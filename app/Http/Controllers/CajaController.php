<?php

namespace App\Http\Controllers;

use App\Models\CajaDiaria;
use App\Models\TransaccionCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class CajaController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    // ESTADO HOY
    // ─────────────────────────────────────────────────────────────
    public function estadoHoy()
    {
        $caja = CajaDiaria::with('administrador:cod,nombre,apellido_paterno')
            ->whereDate('fecha_apertura', now()->toDateString())
            ->where('estado', 'abierta')
            ->first();

        if (!$caja) {
            return response()->json([
                'abierta'        => false,
                'caja'           => null,
                'total_ingresos' => 0,
                'total_egresos'  => 0,
                'saldo_actual'   => 0,
            ]);
        }

        return response()->json([
            'abierta'        => true,
            'caja'           => [
                'cod'           => $caja->cod,
                'fecha_apertura'=> $caja->fecha_apertura,
                'saldo_inicial' => $caja->saldo_inicial,
                'estado'        => $caja->estado,
                'administrador' => $caja->administrador
                    ? trim("{$caja->administrador->nombre} {$caja->administrador->apellido_paterno}")
                    : null,
            ],
            'total_ingresos' => $caja->totalIngresos(),
            'total_egresos'  => $caja->totalEgresos(),
            'saldo_actual'   => $caja->saldoActual(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // ABRIR CAJA
    // ─────────────────────────────────────────────────────────────
    public function abrir(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        $request->validate([
            'saldo_inicial' => 'required|numeric|min:0',
        ], [
            'saldo_inicial.required' => 'El saldo inicial es obligatorio.',
            'saldo_inicial.numeric'  => 'El saldo inicial debe ser un número.',
            'saldo_inicial.min'      => 'El saldo inicial no puede ser negativo.',
        ]);

        // Solo una caja abierta por día
        $existe = CajaDiaria::whereDate('fecha_apertura', now()->toDateString())
            ->where('estado', 'abierta')
            ->exists();

        if ($existe) {
            return response()->json([
                'mensaje' => 'Ya existe una caja abierta hoy. Ciérrala antes de abrir una nueva.',
            ], 422);
        }

        $caja = CajaDiaria::create([
            'cod_administrador' => $user->cod,
            'fecha_apertura'    => now(),
            'saldo_inicial'     => $request->saldo_inicial,
            'estado'            => 'abierta',
        ]);

        return response()->json([
            'mensaje'        => 'Caja abierta correctamente.',
            'cod'            => $caja->cod,
            'fecha_apertura' => $caja->fecha_apertura,
            'saldo_inicial'  => $caja->saldo_inicial,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────
    // CERRAR CAJA
    // ─────────────────────────────────────────────────────────────
    public function cerrar($cod)
    {
        $caja = CajaDiaria::find($cod);

        if (!$caja) {
            return response()->json(['mensaje' => 'Caja no encontrada.'], 404);
        }
        if ($caja->estado === 'cerrada') {
            return response()->json(['mensaje' => 'Esta caja ya está cerrada.'], 422);
        }

        DB::beginTransaction();
        try {
            $saldoFinal       = $caja->saldoActual();
            $caja->estado     = 'cerrada';
            $caja->fecha_cierre = now();
            $caja->saldo_final  = $saldoFinal;
            $caja->save();
            DB::commit();

            return response()->json([
                'mensaje'        => 'Caja cerrada correctamente.',
                'saldo_inicial'  => $caja->saldo_inicial,
                'total_ingresos' => $caja->totalIngresos(),
                'total_egresos'  => $caja->totalEgresos(),
                'saldo_final'    => $saldoFinal,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al cerrar la caja.'], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // REGISTRAR INGRESO
    // ─────────────────────────────────────────────────────────────
    public function registrarIngreso(Request $request)
    {
        $request->validate([
            'monto'       => 'required|numeric|min:0.01',
            'descripcion' => 'required|string|max:255',
        ], [
            'monto.required'       => 'El monto es obligatorio.',
            'monto.min'            => 'El monto debe ser mayor a 0.',
            'descripcion.required' => 'La descripción es obligatoria.',
        ]);

        $caja = $this->getCajaAbiertaHoy();
        if (!$caja) {
            return response()->json(['mensaje' => 'No hay caja abierta hoy. Abre una caja primero.'], 422);
        }

        TransaccionCaja::create([
            'cod_caja'          => $caja->cod,
            'tipo_movimiento'   => 'ingreso',
            'monto'             => $request->monto,
            'descripcion'       => $request->descripcion,
            'fecha_transaccion' => now(),
        ]);

        return response()->json([
            'mensaje'      => 'Ingreso registrado correctamente.',
            'saldo_actual' => $caja->fresh()->saldoActual(),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────
    // REGISTRAR EGRESO
    // ─────────────────────────────────────────────────────────────
    public function registrarEgreso(Request $request)
    {
        $request->validate([
            'monto'       => 'required|numeric|min:0.01',
            'descripcion' => 'required|string|max:255',
        ], [
            'monto.required'       => 'El monto es obligatorio.',
            'monto.min'            => 'El monto debe ser mayor a 0.',
            'descripcion.required' => 'La descripción es obligatoria.',
        ]);

        $caja = $this->getCajaAbiertaHoy();
        if (!$caja) {
            return response()->json(['mensaje' => 'No hay caja abierta hoy. Abre una caja primero.'], 422);
        }

        $saldoActual = $caja->saldoActual();
        if ((float) $request->monto > $saldoActual) {
            return response()->json([
                'mensaje' => "El egreso (Bs. {$request->monto}) supera el saldo actual (Bs. {$saldoActual}).",
            ], 422);
        }

        TransaccionCaja::create([
            'cod_caja'          => $caja->cod,
            'tipo_movimiento'   => 'egreso',
            'monto'             => $request->monto,
            'descripcion'       => $request->descripcion,
            'fecha_transaccion' => now(),
        ]);

        return response()->json([
            'mensaje'      => 'Egreso registrado correctamente.',
            'saldo_actual' => $caja->fresh()->saldoActual(),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────
    // REPORTE POR RANGO DE FECHAS
    // GET /admin/caja/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    // ─────────────────────────────────────────────────────────────
    public function reporte(Request $request)
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $cajas = CajaDiaria::with(['transacciones', 'administrador:cod,nombre,apellido_paterno'])
            ->whereDate('fecha_apertura', '>=', $request->desde)
            ->whereDate('fecha_apertura', '<=', $request->hasta)
            ->orderBy('fecha_apertura', 'desc')
            ->get()
            ->map(function ($c) {
                return [
                    'cod'            => $c->cod,
                    'fecha_apertura' => $c->fecha_apertura,
                    'fecha_cierre'   => $c->fecha_cierre,
                    'estado'         => $c->estado,
                    'saldo_inicial'  => $c->saldo_inicial,
                    'saldo_final'    => $c->saldo_final ?? $c->saldoActual(),
                    'total_ingresos' => $c->totalIngresos(),
                    'total_egresos'  => $c->totalEgresos(),
                    'administrador'  => $c->administrador
                        ? trim("{$c->administrador->nombre} {$c->administrador->apellido_paterno}")
                        : null,
                    'transacciones'  => $c->transacciones->map(fn($t) => [
                        'cod'               => $t->cod,
                        'tipo_movimiento'   => $t->tipo_movimiento,
                        'monto'             => $t->monto,
                        'descripcion'       => $t->descripcion,
                        'fecha_transaccion' => $t->fecha_transaccion,
                    ]),
                ];
            });

        return response()->json([
            'desde'          => $request->desde,
            'hasta'          => $request->hasta,
            'total_cajas'    => $cajas->count(),
            'total_ingresos' => round($cajas->sum('total_ingresos'), 2),
            'total_egresos'  => round($cajas->sum('total_egresos'), 2),
            'balance'        => round($cajas->sum('total_ingresos') - $cajas->sum('total_egresos'), 2),
            'cajas'          => $cajas,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // TRANSACCIONES DEL DÍA (para tabla en tiempo real)
    // ─────────────────────────────────────────────────────────────
    public function transaccionesHoy()
    {
        $caja = $this->getCajaAbiertaHoy();

        if (!$caja) {
            return response()->json(['abierta' => false, 'transacciones' => []]);
        }

        $transacciones = TransaccionCaja::where('cod_caja', $caja->cod)
            ->orderBy('cod', 'desc')
            ->get()
            ->map(fn($t) => [
                'cod'               => $t->cod,
                'tipo_movimiento'   => $t->tipo_movimiento,
                'monto'             => $t->monto,
                'descripcion'       => $t->descripcion,
                'fecha_transaccion' => $t->fecha_transaccion,
            ]);

        return response()->json([
            'abierta'        => true,
            'cod_caja'       => $caja->cod,
            'saldo_inicial'  => $caja->saldo_inicial,
            'total_ingresos' => $caja->totalIngresos(),
            'total_egresos'  => $caja->totalEgresos(),
            'saldo_actual'   => $caja->saldoActual(),
            'transacciones'  => $transacciones,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER PRIVADO
    // ─────────────────────────────────────────────────────────────
    private function getCajaAbiertaHoy(): ?CajaDiaria
    {
        return CajaDiaria::whereDate('fecha_apertura', now()->toDateString())
            ->where('estado', 'abierta')
            ->first();
    }
}
