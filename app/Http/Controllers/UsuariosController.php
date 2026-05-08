<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuariosController extends Controller
{
    // Listar todos los usuarios (admin ve todos)
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

    // Listar roles disponibles
    public function roles()
    {
        return response()->json(Rol::all());
    }

    // Crear usuario (admin crea guías, oficinistas, otros admins)
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

        return response()->json([
            'mensaje'  => 'Usuario creado correctamente.',
            'usuario'  => $user->load('rol'),
        ], 201);
    }

    // Actualizar usuario
    public function update(Request $request, $cod)
    {
        $user = User::find($cod);
        if (!$user) {
            return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        }

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

        $datos = $request->only([
            'nombre', 'apellido_paterno', 'apellido_materno',
            'email', 'cod_rol', 'telefono', 'estado'
        ]);

        if ($request->filled('password')) {
            $datos['password'] = Hash::make($request->password);
        }

        $user->update($datos);

        return response()->json([
            'mensaje' => 'Usuario actualizado.',
            'usuario' => $user->load('rol'),
        ]);
    }

    // Cambiar estado (bloquear/activar)
    public function cambiarEstado(Request $request, $cod)
    {
        $user = User::find($cod);
        if (!$user) {
            return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        }

        $request->validate([
            'estado' => 'required|in:activo,inactivo,bloqueado',
        ]);

        $user->estado = $request->estado;
        $user->save();

        return response()->json(['mensaje' => 'Estado actualizado.']);
    }

    // Eliminar usuario
    public function destroy($cod)
    {
        $user = User::find($cod);
        if (!$user) {
            return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
        }

        $user->delete();
        return response()->json(['mensaje' => 'Usuario eliminado.']);
    }

    // Estadísticas para el dashboard
    public function estadisticas()
    {
        $totalUsuarios    = User::count();
        $totalAdmins      = User::whereHas('rol', fn($q) => $q->where('nombre', 'Administrador'))->count();
        $totalGuias = User::whereHas('rol', fn($q) => $q->where('nombre', 'Guía Turístico'))->count();
        $totalTuristas    = User::whereHas('rol', fn($q) => $q->where('nombre', 'Turista'))->count();
        $totalOficinistas = User::whereHas('rol', fn($q) => $q->where('nombre', 'Oficinista'))->count();
        $totalSitios      = \App\Models\SitioTuristico::where('estado', 'activo')->count();
        $totalPaquetes    = \App\Models\PaqueteTuristico::where('estado', 'activo')->count();

        return response()->json([
            'total_usuarios'    => $totalUsuarios,
            'total_admins'      => $totalAdmins,
            'total_guias'       => $totalGuias,
            'total_turistas'    => $totalTuristas,
            'total_oficinistas' => $totalOficinistas,
            'total_sitios'      => $totalSitios,
            'total_paquetes'    => $totalPaquetes,
        ]);
    }
}
