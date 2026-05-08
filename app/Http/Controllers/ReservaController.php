<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\Pago;
use App\Models\PagoTarjeta;
use App\Models\PagoQr;
use App\Models\PaqueteTuristico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // <-- IMPORTANTE PARA TRANSACCIONES
use Tymon\JWTAuth\Facades\JWTAuth;

class ReservaController extends Controller
{
    // Tipo de cambio fijo (puedes hacerlo dinámico después)
    const TIPO_CAMBIO_USD = 6.96; // 1 USD = 6.96 Bs

    // ===== CREAR RESERVA + PAGO (NORMALIZADO EN 3NF) =====
    public function store(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        // 1. Validaciones
        // 1. Validaciones
        $request->validate([
            'cod_paquete'        => 'required|exists:paquetes_turisticos,cod',
            'fecha_reserva'      => 'required|date|after_or_equal:today',
            'cantidad_pasajeros' => 'required|integer|min:1|max:20',
            'metodo_pago'        => 'required|in:efectivo,tarjeta,qr',
            'moneda'             => 'required|in:BOB,USD',

            // Validaciones exclusivas si el método de pago es tarjeta
            'tarjeta_numero'     => 'required_if:metodo_pago,tarjeta|string|min:16',
            'tarjeta_titular'    => 'required_if:metodo_pago,tarjeta|string|max:100',
            'tarjeta_mes'        => 'required_if:metodo_pago,tarjeta|string|size:2',
            'tarjeta_anio'       => 'required_if:metodo_pago,tarjeta|string|size:2',
            'tarjeta_cvv'        => 'required_if:metodo_pago,tarjeta|string|min:3|max:4', // <-- ESTA LÍNEA ES NUEVA
        ]);

        $paquete = PaqueteTuristico::find($request->cod_paquete);

        // 2. Calcular monto según moneda
        if ($request->moneda === 'USD') {
            $montoUSD = round($paquete->precio_bs / self::TIPO_CAMBIO_USD, 2);
            $montoBs  = $paquete->precio_bs * $request->cantidad_pasajeros;
        } else {
            $montoBs  = $paquete->precio_bs * $request->cantidad_pasajeros;
            $montoUSD = round($montoBs / self::TIPO_CAMBIO_USD, 2);
        }

        // 3. INICIAR TRANSACCIÓN DE BASE DE DATOS
        DB::beginTransaction();

        try {
            // A. Crear reserva principal
            $reserva = Reserva::create([
                'cod_turista'        => $user->cod,
                'cod_paquete'        => $request->cod_paquete,
                'fecha_reserva'      => $request->fecha_reserva,
                'cantidad_pasajeros' => $request->cantidad_pasajeros,
                'estado'             => 'pendiente',
            ]);

            // B. Crear pago base (Tabla principal 'pagos')
            $pago = Pago::create([
                'cod_reserva'  => $reserva->cod,
                'monto_pagado' => $montoBs,
                'metodo_pago'  => $request->metodo_pago . '_' . $request->moneda,
                'estado'       => 'pendiente', // Asumiendo que agregaste estado a la tabla pagos
                'fecha_pago'   => now(),
            ]);

            // C. Crear detalles específicos en tablas normalizadas (3NF)
            if ($request->metodo_pago === 'tarjeta') {
                PagoTarjeta::create([
                    'cod_pago'        => $pago->cod,
                    'titular'         => $request->tarjeta_titular,
                    'numero_cifrado'  => $request->tarjeta_numero, // Tu modelo se encarga de cifrarlo
                    'mes_expiracion'  => $request->tarjeta_mes,
                    'anio_expiracion' => $request->tarjeta_anio,
                ]);
            } elseif ($request->metodo_pago === 'qr') {
                PagoQr::create([
                    'cod_pago'        => $pago->cod,
                    'comprobante_url' => 'comprobante_pendiente.png', // Simulado por ahora
                ]);
            }

            // D. Si todo salió bien, CONFIRMAMOS LA TRANSACCIÓN
            DB::commit();

            return response()->json([
                'mensaje'   => 'Reserva y pago creados correctamente.',
                'reserva'   => $reserva->cod,
                'monto_bs'  => $montoBs,
                'monto_usd' => $montoUSD,
                'estado'    => 'pendiente',
            ], 201);

        } catch (\Exception $e) {
            // E. SI HAY CUALQUIER ERROR, DESHACEMOS TODO PARA EVITAR DATOS CORRUPTOS
            DB::rollBack();
            return response()->json([
                'mensaje' => 'Error al procesar la reserva y el pago.',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    // ===== MIS RESERVAS (turista ve las suyas) =====
    public function misReservas()
    {
        $user = JWTAuth::parseToken()->authenticate();

        $reservas = Reserva::with(['paquete.sitios', 'pagos'])
            ->where('cod_turista', $user->cod)
            ->orderBy('cod', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'cod'                => $r->cod,
                    'fecha_reserva'      => $r->fecha_reserva,
                    'cantidad_pasajeros' => $r->cantidad_pasajeros,
                    'estado'             => $r->estado,
                    'paquete' => [
                        'cod'            => $r->paquete->cod,
                        'nombre'         => $r->paquete->nombre,
                        'duracion_horas' => $r->paquete->duracion_horas,
                        'foto_principal' => $r->paquete->foto_principal,
                        'sitios'         => $r->paquete->sitios->map(fn($s) => [
                            'cod'       => $s->cod,
                            'nombre'    => $s->nombre,
                            'tiene_360' => $s->escenas360()->exists(),
                            'tiene_ra'  => $s->targetsRa()->exists(),
                        ]),
                    ],
                    'pago' => $r->pagos->first() ? [
                        'monto_pagado' => $r->pagos->first()->monto_pagado,
                        'metodo_pago'  => $r->pagos->first()->metodo_pago,
                        'fecha_pago'   => $r->pagos->first()->fecha_pago,
                    ] : null,
                ];
            });

        return response()->json($reservas);
    }

    // ===== CANCELAR RESERVA =====
    public function cancelar($cod)
    {
        $user = JWTAuth::parseToken()->authenticate();

        $reserva = Reserva::where('cod', $cod)
            ->where('cod_turista', $user->cod)
            ->first();

        if (!$reserva) {
            return response()->json(['mensaje' => 'Reserva no encontrada.'], 404);
        }

        if ($reserva->estado === 'completada') {
            return response()->json(['mensaje' => 'No puedes cancelar una reserva completada.'], 422);
        }

        $reserva->estado = 'cancelada';
        $reserva->save();

        return response()->json(['mensaje' => 'Reserva cancelada correctamente.']);
    }

    // ===== TIPO DE CAMBIO (para mostrar en frontend) =====
    public function tipoCambio()
    {
        return response()->json([
            'BOB_por_USD' => self::TIPO_CAMBIO_USD,
            'USD_por_BOB' => round(1 / self::TIPO_CAMBIO_USD, 4),
        ]);
    }
}
