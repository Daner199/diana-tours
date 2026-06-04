<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\Rol;

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

        // Normalizar: quitar tildes para comparar sin problemas de encoding
        $normalizar = fn(string $s) => strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $s));

        // Soportar roles separados por coma: 'Administrador,Oficinista'
        $rolesExpandidos = [];
        foreach ($roles as $r) {
            foreach (explode(',', $r) as $parte) {
                $rolesExpandidos[] = trim($parte);
            }
        }
        $rolesNormalizados    = array_map($normalizar, $rolesExpandidos);
        $nombreRolNormalizado = $normalizar($nombreRol ?? '');

        if (!in_array($nombreRolNormalizado, $rolesNormalizados)) {
            return response()->json([
                'mensaje'          => 'No tienes permiso para acceder a esta sección.',
                'tu_rol'           => $nombreRol,
                'roles_permitidos' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
