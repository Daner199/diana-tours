<?php

namespace App\Http\Controllers;

use App\Models\SitioTuristico;
use Illuminate\Http\Request;

class SitioTuristicoController extends Controller
{
    public function index()
    {
        return response()->json(
            SitioTuristico::where('estado', 'activo')->get()
        );
    }

    public function indexAdmin()
    {
        return response()->json(SitioTuristico::all());
    }

    public function show($cod)
    {
        $sitio = SitioTuristico::with('paquetes')->find($cod);
        if (!$sitio) {
            return response()->json(['mensaje' => 'Sitio no encontrado.'], 404);
        }
        return response()->json($sitio);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'      => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'foto'        => 'nullable|string',
            'latitud'     => 'nullable|numeric',
            'longitud'    => 'nullable|numeric',
            'estado'      => 'nullable|in:activo,inactivo',
        ]);

        $sitio = SitioTuristico::create(
            $request->only(['nombre', 'descripcion', 'foto', 'latitud', 'longitud', 'estado'])
        );

        return response()->json(['mensaje' => 'Sitio creado.', 'sitio' => $sitio], 201);
    }

    public function update(Request $request, $cod)
    {
        $sitio = SitioTuristico::find($cod);
        if (!$sitio) {
            return response()->json(['mensaje' => 'Sitio no encontrado.'], 404);
        }

        $request->validate([
            'nombre'      => 'sometimes|string|max:150',
            'descripcion' => 'nullable|string',
            'foto'        => 'nullable|string',
            'latitud'     => 'nullable|numeric',
            'longitud'    => 'nullable|numeric',
            'estado'      => 'nullable|in:activo,inactivo',
        ]);

        $sitio->update(
            $request->only(['nombre', 'descripcion', 'foto', 'latitud', 'longitud', 'estado'])
        );

        return response()->json(['mensaje' => 'Sitio actualizado.', 'sitio' => $sitio]);
    }

    public function destroy($cod)
    {
        $sitio = SitioTuristico::find($cod);
        if (!$sitio) {
            return response()->json(['mensaje' => 'Sitio no encontrado.'], 404);
        }
        $sitio->delete();
        return response()->json(['mensaje' => 'Sitio eliminado.']);
    }
}
