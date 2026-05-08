<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class VerificarRol
{
    public function handle(Request $request, Closure $next, ...$roles): mixed
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (\Exception $e) {
            return response()->json(['mensaje' => 'No autenticado.'], 401);
        }

        if (!$user) {
            return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        }

        $user->load('rol');
        $nombreRol = $user->rol?->nombre;

        if (!in_array($nombreRol, $roles)) {
            return response()->json([
                'mensaje' => 'No tienes permiso para acceder a esta sección.',
                'tu_rol'  => $nombreRol,
                'roles_permitidos' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
