<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ValidacionAcceso;
use App\Models\DispositivoConfiable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AuthController
{
    // ==================== REGISTRO ====================
    public function registro(Request $request)
    {
        $request->validate([
            'nombre'           => 'required|string|max:50',
            'apellido_paterno' => 'required|string|max:50',
            'apellido_materno' => 'nullable|string|max:50',
            'email'            => 'required|email|unique:usuarios,email',
            'password'         => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
            'cod_rol'          => 'required|exists:roles,cod', // Se asegura que el 3 (Turista) exista en la DB
            'telefono'         => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'nombre'           => $request->nombre,
            'apellido_paterno' => $request->apellido_paterno,
            'apellido_materno' => $request->apellido_materno,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'cod_rol'          => $request->cod_rol,
            'telefono'         => $request->telefono,
            'estado'           => 'inactivo',
        ]);

        $codigo = rand(100000, 999999);

        ValidacionAcceso::create([
            'cod_usuario'         => $user->cod,
            'codigo_verificacion' => $codigo,
            'expira_en'           => \Carbon\Carbon::now()->addMinutes(60),
            'usado'               => false,
        ]);

        \Illuminate\Support\Facades\Mail::raw(
            "Hola {$user->nombre},\n\nTu código de verificación es: $codigo\n\nExpira en 60 minutos.\n\nDiana Tours SRL",
            function ($msg) use ($user) {
                $msg->to($user->email)->subject('Verifica tu cuenta - Diana Tours');
            }
        );

        return response()->json([
            'mensaje'  => 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
            'user_cod' => $user->cod,
        ], 201);
    }

    // ==================== VERIFICAR CUENTA ====================
    public function verificarCuenta(Request $request)
    {
        $request->validate([
            'user_cod' => 'required|exists:usuarios,cod',
            'codigo'   => 'required|digits:6',
        ]);

        $validacion = ValidacionAcceso::where('cod_usuario', $request->user_cod)
            ->where('codigo_verificacion', $request->codigo)
            ->where('usado', false)
            ->where('expira_en', '>', Carbon::now())
            ->first();

        if (!$validacion) {
            return response()->json(['mensaje' => 'Código inválido o expirado.'], 422);
        }

        $validacion->usado = true;
        $validacion->save();

        $user = User::find($request->user_cod);
        $user->estado = 'activo';
        $user->save();

        return response()->json(['mensaje' => 'Cuenta verificada. Ya puedes iniciar sesión.']);
    }

    // ==================== LOGIN ====================
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'token_dispositivo' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['mensaje' => 'Credenciales incorrectas.'], 401);
        }

        // Verificar bloqueo
        if ($user->estado === 'bloqueado') {
            $desbloqueo = Cache::get('desbloqueo_' . $user->cod);
            if ($desbloqueo && Carbon::now()->lt($desbloqueo)) {
                $minutos = Carbon::now()->diffInMinutes($desbloqueo);
                return response()->json([
                    'mensaje' => "Cuenta bloqueada. Intenta en $minutos minutos."
                ], 423);
            }
            // Desbloquear automáticamente
            $user->estado = 'activo';
            Cache::forget('intentos_' . $user->cod);
            $user->save();
        }

        // Verificar contraseña
        if (!Hash::check($request->password, $user->password)) {
            $intentos = Cache::get('intentos_' . $user->cod, 0) + 1;
            Cache::put('intentos_' . $user->cod, $intentos, now()->addMinutes(15));

            if ($intentos >= 5) {
                $user->estado = 'bloqueado';
                $user->save();
                Cache::put('desbloqueo_' . $user->cod, now()->addMinutes(15), now()->addMinutes(15));
                return response()->json([
                    'mensaje' => 'Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.'
                ], 423);
            }

            $restantes = 5 - $intentos;
            return response()->json([
                'mensaje' => "Contraseña incorrecta. Te quedan $restantes intentos."
            ], 401);
        }

        // Verificar que la cuenta esté activa
        if ($user->estado !== 'activo') {
            return response()->json([
                'mensaje' => 'Debes verificar tu correo antes de ingresar.'
            ], 403);
        }

        // Resetear intentos fallidos
        Cache::forget('intentos_' . $user->cod);

        // ✅ VERIFICAR SI EL DISPOSITIVO YA ES CONFIABLE
        if ($request->token_dispositivo && $request->token_dispositivo !== 'null') {
    $dispositivoConfiable = DispositivoConfiable::where('cod_usuario', $user->cod)
        ->where('token_dispositivo', $request->token_dispositivo)
        ->where('expira_en', '>', Carbon::now())
        ->first();

            if ($dispositivoConfiable) {
        $token = JWTAuth::fromUser($user);
        return response()->json([
            'mensaje'           => 'Acceso concedido (dispositivo confiable).',
            'token'             => $token,
            'dispositivo_conocido' => true,
            'usuario' => [
                'cod'    => $user->cod,
                'nombre' => $user->nombre,
                'email'  => $user->email,
                'cod_rol' => $user->cod_rol,
            ],
        ]);
            }
        }

        // Dispositivo nuevo — enviar código 2FA
        $codigo2fa = rand(100000, 999999);

        ValidacionAcceso::create([
            'cod_usuario'         => $user->cod,
            'codigo_verificacion' => $codigo2fa,
            'expira_en'           => Carbon::now()->addMinutes(10),
            'usado'               => false,
        ]);

        \Illuminate\Support\Facades\Mail::raw(
            "Hola {$user->nombre},\n\nTu código de acceso es: $codigo2fa\n\nExpira en 10 minutos. Si no fuiste tú, ignora este mensaje.\n\nDiana Tours SRL",
            function ($msg) use ($user) {
                $msg->to($user->email)->subject('Código de verificación - Diana Tours');
            }
        );

        return response()->json([
            'mensaje'  => 'Código enviado a tu correo.',
            'user_cod' => $user->cod,
            'paso'     => '2fa',
        ]);
    }
// ==================== ACTUALIZAR PERFIL ====================
public function actualizarPerfil(Request $request)
{
    $user = JWTAuth::parseToken()->authenticate();

    $request->validate([
        'nombre'           => 'sometimes|string|max:50',
        'apellido_paterno' => 'sometimes|string|max:50',
        'apellido_materno' => 'nullable|string|max:50',
        'telefono'         => 'nullable|string|max:20',
    ]);

    $user->update($request->only([
        'nombre', 'apellido_paterno', 'apellido_materno', 'telefono'
    ]));

    return response()->json([
        'mensaje' => 'Perfil actualizado correctamente.',
        'usuario' => [
            'cod'              => $user->cod,
            'nombre'           => $user->nombre,
            'apellido_paterno' => $user->apellido_paterno,
            'apellido_materno' => $user->apellido_materno,
            'email'            => $user->email,
            'telefono'         => $user->telefono,
            'foto_perfil'      => $user->foto_perfil,
            'cod_rol'          => $user->cod_rol,
        ],
    ]);
}

// ==================== CAMBIAR CONTRASEÑA ====================
public function cambiarPassword(Request $request)
{
    $user = JWTAuth::parseToken()->authenticate();

    $request->validate([
        'password_actual' => 'required|string',
        'password_nuevo'  => [
            'required', 'string', 'min:8',
            'regex:/[a-z]/', 'regex:/[A-Z]/',
            'regex:/[0-9]/', 'regex:/[@$!%*#?&]/',
        ],
    ]);

    if (!Hash::check($request->password_actual, $user->password)) {
        return response()->json(['mensaje' => 'La contraseña actual es incorrecta.'], 422);
    }

    $user->password = Hash::make($request->password_nuevo);
    $user->save();

    return response()->json(['mensaje' => 'Contraseña actualizada correctamente.']);
}
    // ==================== VERIFICAR 2FA ====================
    public function verificar2fa(Request $request)
    {
        $request->validate([
            'user_cod'           => 'required|exists:usuarios,cod',
            'codigo'             => 'required|digits:6',
            'recordar_dispositivo' => 'nullable|boolean',
            'nombre_dispositivo'   => 'nullable|string|max:100',
        ]);

        $validacion = ValidacionAcceso::where('cod_usuario', $request->user_cod)
            ->where('codigo_verificacion', $request->codigo)
            ->where('usado', false)
            ->where('expira_en', '>', Carbon::now())
            ->latest('cod')
            ->first();

        if (!$validacion) {
            return response()->json(['mensaje' => 'Código inválido o expirado.'], 422);
        }

        $validacion->usado = true;
        $validacion->save();

        $user = User::find($request->user_cod);
        $token = JWTAuth::fromUser($user);

        // ✅ SI QUIERE RECORDAR ESTE DISPOSITIVO
        $tokenDispositivo = null;
        if ($request->recordar_dispositivo) {
            $tokenDispositivo = Str::random(64);
            DispositivoConfiable::create([
                'cod_usuario'       => $user->cod,
                'token_dispositivo' => $tokenDispositivo,
                'nombre_dispositivo' => $request->nombre_dispositivo ?? 'Mi dispositivo',
                'expira_en'         => Carbon::now()->addDays(30),
            ]);
        }

        return response()->json([
            'mensaje'           => 'Acceso concedido.',
            'token'             => $token,
            'token_dispositivo' => $tokenDispositivo,
            'usuario' => [
                'cod'     => $user->cod,
                'nombre'  => $user->nombre,
                'email'   => $user->email,
                'cod_rol' => $user->cod_rol,
            ],
        ]);
    }

    // ==================== LOGOUT ====================
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['mensaje' => 'Sesión cerrada correctamente.']);
    }

    // ==================== PERFIL ====================
    public function perfil()
    {
        $user = JWTAuth::parseToken()->authenticate();
        return response()->json($user->load('rol'));
    }
    // ==================== RECUPERAR CONTRASEÑA ====================
    public function enviarEnlaceRecuperacion(Request $request) {
        $request->validate(['email' => 'required|email|exists:usuarios,email']);

        $user = User::where('email', $request->email)->first();
        $codigo = rand(100000, 999999);

        // Reutilizamos la tabla de validaciones para el código de reset
        ValidacionAcceso::create([
            'cod_usuario' => $user->cod,
            'codigo_verificacion' => $codigo,
            'expira_en' => Carbon::now()->addMinutes(15),
            'usado' => false,
        ]);

        Mail::raw("Tu código para restablecer tu contraseña es: $codigo", function($msg) use ($user) {
            $msg->to($user->email)->subject('Restablecer Contraseña - Diana Tours');
        });

        return response()->json(['mensaje' => 'Código enviado al correo.']);
    }

    public function restablecerPassword(Request $request) {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
            'codigo' => 'required|digits:6',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/'
        ]);

        $user = User::where('email', $request->email)->first();
        $val = ValidacionAcceso::where('cod_usuario', $user->cod)
            ->where('codigo_verificacion', $request->codigo)
            ->where('usado', false)
            ->where('expira_en', '>', Carbon::now())
            ->first();

        if (!$val) return response()->json(['mensaje' => 'Código inválido o expirado.'], 422);

        $user->password = Hash::make($request->password);
        $user->save();

        $val->usado = true;
        $val->save();

        return response()->json(['mensaje' => 'Contraseña actualizada con éxito.']);
    }
   public function actualizarFoto(Request $request)
{
    $request->validate([
        'cod_usuario' => 'required|exists:usuarios,cod',
        'foto_perfil' => 'required|string', // Aquí recibimos el Base64
    ]);

    $user = \App\Models\User::find($request->cod_usuario);

    if (!$user) {
        return response()->json(['mensaje' => 'Usuario no encontrado.'], 404);
    }

    $user->foto_perfil = $request->foto_perfil;
    $user->save();

    return response()->json([
        'mensaje' => 'Foto actualizada correctamente en la base de datos.',
        'foto' => $user->foto_perfil
    ]);
}
}
