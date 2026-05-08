<?php

namespace App\Http\Controllers;

use App\Models\PaqueteTuristico;
use Illuminate\Http\Request;

class PaqueteTuristicoController extends Controller
{
    public function index()
    {
        return response()->json(
            PaqueteTuristico::with('sitios')->where('estado', 'activo')->get()
        );
    }

    public function indexAdmin()
    {
        return response()->json(
            PaqueteTuristico::with('sitios')->get()
        );
    }

    public function show($cod)
    {
        $paquete = PaqueteTuristico::with('sitios')->find($cod);
        if (!$paquete) {
            return response()->json(['mensaje' => 'Paquete no encontrado.'], 404);
        }
        return response()->json($paquete);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'         => 'required|string|max:200',
            'precio_bs'      => 'required|numeric|min:0',
            'duracion_horas' => 'required|numeric|min:0.5',
            'estado'         => 'nullable|in:activo,inactivo',
            'foto_principal' => 'nullable|string',
            'acerca_de'      => 'nullable|string',
            'que_esperar'    => 'nullable|string',
            'itinerario'     => 'nullable|array',
            'incluye'        => 'nullable|array',
            'no_incluye'     => 'nullable|array',
            'sitios'         => 'nullable|array',
            'sitios.*'       => 'exists:sitios_turisticos,cod',
        ]);

        $paquete = PaqueteTuristico::create([
            'nombre'         => $request->nombre,
            'precio_bs'      => $request->precio_bs,
            'duracion_horas' => $request->duracion_horas,
            'estado'         => $request->estado ?? 'activo',
            'foto_principal' => $request->foto_principal,
            'acerca_de'      => $request->acerca_de,
            'que_esperar'    => $request->que_esperar,
            'itinerario'     => $request->itinerario,
            'incluye'        => $request->incluye,
            'no_incluye'     => $request->no_incluye,
        ]);

        if ($request->sitios) {
            $paquete->sitios()->attach($request->sitios);
        }

        return response()->json([
            'mensaje' => 'Paquete creado.',
            'paquete' => $paquete->load('sitios')
        ], 201);
    }

    public function update(Request $request, $cod)
    {
        $paquete = PaqueteTuristico::find($cod);
        if (!$paquete) {
            return response()->json(['mensaje' => 'Paquete no encontrado.'], 404);
        }

        $request->validate([
            'nombre'         => 'sometimes|string|max:200',
            'precio_bs'      => 'sometimes|numeric|min:0',
            'duracion_horas' => 'sometimes|numeric|min:0.5',
            'estado'         => 'nullable|in:activo,inactivo',
            'foto_principal' => 'nullable|string',
            'acerca_de'      => 'nullable|string',
            'que_esperar'    => 'nullable|string',
            'itinerario'     => 'nullable|array',
            'incluye'        => 'nullable|array',
            'no_incluye'     => 'nullable|array',
            'sitios'         => 'nullable|array',
            'sitios.*'       => 'exists:sitios_turisticos,cod',
        ]);

        $paquete->update($request->only([
            'nombre', 'precio_bs', 'duracion_horas', 'estado',
            'foto_principal', 'acerca_de', 'que_esperar',
            'itinerario', 'incluye', 'no_incluye',
        ]));

        if ($request->has('sitios')) {
            $paquete->sitios()->sync($request->sitios ?? []);
        }

        return response()->json([
            'mensaje' => 'Paquete actualizado.',
            'paquete' => $paquete->load('sitios')
        ]);
    }

    public function destroy($cod)
    {
        $paquete = PaqueteTuristico::find($cod);
        if (!$paquete) {
            return response()->json(['mensaje' => 'Paquete no encontrado.'], 404);
        }
        $paquete->sitios()->detach();
        $paquete->delete();
        return response()->json(['mensaje' => 'Paquete eliminado.']);
    }
}
