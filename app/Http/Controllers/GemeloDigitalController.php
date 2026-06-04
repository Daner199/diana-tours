<?php

namespace App\Http\Controllers;

use App\Models\Escena360;
use App\Models\Hotspot360;
use App\Models\MetricaInmersion;
use App\Models\SitioTuristico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class GemeloDigitalController extends Controller
{
    // =========================================================================
    // PÚBLICO — Escenas de un sitio (con sus hotspots)
    // =========================================================================
    public function index($cod_sitio)
    {
        $sitio = SitioTuristico::find($cod_sitio);
        if (!$sitio) {
            return response()->json(['mensaje' => 'Sitio no encontrado.'], 404);
        }

        $escenas = Escena360::where('cod_sitio', $cod_sitio)
            ->with('hotspots')
            ->get()
            ->map(fn($e) => [
                'cod'               => $e->cod,
                'nombre'            => $e->nombre,
                'archivo_imagen_url'=> $e->archivo_imagen_url,
                'es_inicio'         => (bool) $e->es_inicio,
                'hotspots'          => $e->hotspots->map(fn($h) => [
                    'cod'               => $h->cod,
                    'tipo_interaccion'  => $h->tipo_interaccion,
                    'posicion_x'        => $h->posicion_x,
                    'posicion_y'        => $h->posicion_y,
                    'texto_informativo' => $h->texto_informativo,
                    'cod_escena_destino'=> $h->cod_escena_destino,
                ]),
            ]);

        return response()->json([
            'sitio'  => ['cod' => $sitio->cod, 'nombre' => $sitio->nombre],
            'escenas'=> $escenas,
        ]);
    }

    // =========================================================================
    // ADMIN — Escenas de un sitio (vista admin con más info)
    // =========================================================================
    public function indexAdmin($cod_sitio)
    {
        $escenas = Escena360::where('cod_sitio', $cod_sitio)
            ->with('hotspots')
            ->orderByDesc('es_inicio')
            ->orderBy('cod')
            ->get()
            ->map(fn($e) => [
                'cod'               => $e->cod,
                'nombre'            => $e->nombre,
                'archivo_imagen_url'=> $e->archivo_imagen_url,
                'es_inicio'         => (bool) $e->es_inicio,
                'total_hotspots'    => $e->hotspots->count(),
                'hotspots'          => $e->hotspots->map(fn($h) => [
                    'cod'               => $h->cod,
                    'tipo_interaccion'  => $h->tipo_interaccion,
                    'posicion_x'        => $h->posicion_x,
                    'posicion_y'        => $h->posicion_y,
                    'texto_informativo' => $h->texto_informativo,
                    'cod_escena_destino'=> $h->cod_escena_destino,
                ]),
            ]);

        return response()->json($escenas);
    }

    // =========================================================================
    // ADMIN — Crear escena (URL externa de imagen panorámica)
    // =========================================================================
    public function store(Request $request)
    {
        $request->validate([
            'cod_sitio'          => 'required|exists:sitios_turisticos,cod',
            'nombre'             => 'required|string|max:100',
            'archivo_imagen_url' => 'required|string', // ✅ Quitamos la regla 'url'
            'es_inicio'          => 'boolean',
        ], [
            'archivo_imagen_url.required' => 'La URL o el Iframe de la imagen es obligatorio.',
        ]);

        DB::beginTransaction();
        try {
            // Si es_inicio=true, quitar es_inicio de otras escenas del mismo sitio
            if ($request->boolean('es_inicio', false)) {
                Escena360::where('cod_sitio', $request->cod_sitio)
                    ->update(['es_inicio' => false]);
            }

            $escena = Escena360::create([
                'cod_sitio'          => $request->cod_sitio,
                'nombre'             => $request->nombre,
                'archivo_imagen_url' => $request->archivo_imagen_url,
                'es_inicio'          => $request->boolean('es_inicio', false),
            ]);

            DB::commit();
            return response()->json([
                'mensaje' => 'Escena creada correctamente.',
                'escena'  => $escena,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al crear la escena.'], 500);
        }
    }

    // =========================================================================
    // ADMIN — Actualizar escena
    // =========================================================================
   public function update(Request $request, $cod)
    {
        $escena = Escena360::find($cod);
        if (!$escena) {
            return response()->json(['mensaje' => 'Escena no encontrada.'], 404);
        }

        $request->validate([
            'nombre'             => 'sometimes|string|max:100',
            'archivo_imagen_url' => 'sometimes|string', // ✅ Quitamos la regla 'url'
            'es_inicio'          => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            if ($request->boolean('es_inicio', false)) {
                Escena360::where('cod_sitio', $escena->cod_sitio)
                    ->where('cod', '!=', $cod)
                    ->update(['es_inicio' => false]);
            }

            $escena->update($request->only(['nombre', 'archivo_imagen_url', 'es_inicio']));
            DB::commit();

            return response()->json(['mensaje' => 'Escena actualizada.', 'escena' => $escena]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al actualizar la escena.'], 500);
        }
    }

    // =========================================================================
    // ADMIN — Eliminar escena
    // =========================================================================
    public function destroy($cod)
    {
        $escena = Escena360::find($cod);
        if (!$escena) {
            return response()->json(['mensaje' => 'Escena no encontrada.'], 404);
        }

        DB::beginTransaction();
        try {
            Hotspot360::where('cod_escena', $cod)->delete();
            $escena->delete();
            DB::commit();
            return response()->json(['mensaje' => 'Escena eliminada correctamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['mensaje' => 'Error al eliminar la escena.'], 500);
        }
    }

    // =========================================================================
    // ADMIN — Crear hotspot en una escena
    // =========================================================================
    public function storeHotspot(Request $request)
    {
        $request->validate([
            'cod_escena'         => 'required|exists:escenas_360,cod',
            'tipo_interaccion'   => 'required|in:informacion,navegacion',
            'posicion_x'         => 'required|numeric',
            'posicion_y'         => 'required|numeric',
            'texto_informativo'  => 'nullable|string|max:500',
            'cod_escena_destino' => 'nullable|exists:escenas_360,cod',
        ], [
            'tipo_interaccion.in' => 'El tipo debe ser "informacion" o "navegacion".',
        ]);

        $hotspot = Hotspot360::create([
            'cod_escena'         => $request->cod_escena,
            'tipo_interaccion'   => $request->tipo_interaccion,
            'posicion_x'         => $request->posicion_x,
            'posicion_y'         => $request->posicion_y,
            'texto_informativo'  => $request->texto_informativo,
            'cod_escena_destino' => $request->cod_escena_destino,
        ]);

        return response()->json(['mensaje' => 'Hotspot creado.', 'hotspot' => $hotspot], 201);
    }

    // =========================================================================
    // ADMIN — Actualizar hotspot
    // =========================================================================
    public function updateHotspot(Request $request, $cod)
    {
        $hotspot = Hotspot360::find($cod);
        if (!$hotspot) {
            return response()->json(['mensaje' => 'Hotspot no encontrado.'], 404);
        }

        $request->validate([
            'tipo_interaccion'   => 'sometimes|in:informacion,navegacion',
            'posicion_x'         => 'sometimes|numeric',
            'posicion_y'         => 'sometimes|numeric',
            'texto_informativo'  => 'nullable|string|max:500',
            'cod_escena_destino' => 'nullable|exists:escenas_360,cod',
        ]);

        $hotspot->update($request->only([
            'tipo_interaccion', 'posicion_x', 'posicion_y',
            'texto_informativo', 'cod_escena_destino',
        ]));

        return response()->json(['mensaje' => 'Hotspot actualizado.', 'hotspot' => $hotspot]);
    }

    // =========================================================================
    // ADMIN — Eliminar hotspot
    // =========================================================================
    public function deleteHotspot($cod)
    {
        $hotspot = Hotspot360::find($cod);
        if (!$hotspot) {
            return response()->json(['mensaje' => 'Hotspot no encontrado.'], 404);
        }

        $hotspot->delete();
        return response()->json(['mensaje' => 'Hotspot eliminado.']);
    }

    // =========================================================================
    // AUTH — Registrar métrica de inmersión
    // =========================================================================
    public function registrarMetrica(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        $request->validate([
            'cod_sitio'         => 'required|exists:sitios_turisticos,cod',
            'duracion_segundos' => 'required|integer|min:1',
        ]);

        MetricaInmersion::create([
            'cod_usuario'       => $user->cod,
            'cod_sitio'         => $request->cod_sitio,
            'tecnologia_usada'  => '360',
            'duracion_segundos' => $request->duracion_segundos,
            'fecha_interaccion' => now(),
        ]);

        return response()->json(['mensaje' => 'Métrica registrada.'], 201);
    }
}
