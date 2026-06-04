<?php

namespace App\Http\Controllers;

use App\Models\IncidenciaTour;
use App\Models\GrupoOperativo;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class IncidenciaController extends Controller
{
    // ===== LISTAR INCIDENCIAS DE UN GRUPO =====
    public function index($cod_grupo)
    {
        $grupo = GrupoOperativo::find($cod_grupo);
        if (!$grupo) return response()->json(['mensaje' => 'Grupo no encontrado.'], 404);

        $incidencias = IncidenciaTour::where('cod_grupo', $cod_grupo)
            ->orderBy('fecha_reporte', 'desc')
            ->get();

        return response()->json($incidencias);
    }

    // ===== REGISTRAR INCIDENCIA =====
    public function store(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        $request->validate([
            'cod_grupo'      => 'required|exists:grupos_operativos,cod',
            'descripcion'    => 'required|string|max:1000',
            'nivel_gravedad' => 'required|in:leve,moderado,grave',
        ]);

        $incidencia = IncidenciaTour::create([
            'cod_grupo'      => $request->cod_grupo,
            'descripcion'    => $request->descripcion,
            'nivel_gravedad' => $request->nivel_gravedad,
            'fecha_reporte'  => now(),
        ]);

        return response()->json([
            'mensaje'    => 'Incidencia registrada.',
            'incidencia' => $incidencia,
        ], 201);
    }

}
