<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UsuariosPruebaSeeder extends Seeder
{
    public function run(): void
    {
        // Asegurar que los roles existan
        $roles = [
            ['cod' => 1, 'nombre' => 'Administrador',   'descripcion' => 'Acceso total al sistema'],
            ['cod' => 2, 'nombre' => 'Guía Turístico',  'descripcion' => 'Gestión de tours y grupos'],
            ['cod' => 3, 'nombre' => 'Turista',          'descripcion' => 'Cliente del sistema'],
            ['cod' => 4, 'nombre' => 'Oficinista',       'descripcion' => 'Control de caja y reservas'],
        ];

        foreach ($roles as $rol) {
            DB::table('roles')->updateOrInsert(['cod' => $rol['cod']], $rol);
        }

        $now = Carbon::now();

        $usuarios = [
            [
                'cod_rol'          => 1,
                'nombre'           => 'Daner',
                'apellido_paterno' => 'Escobar',
                'apellido_materno' => 'Coronado',
                'email'            => 'escobardaner48@gmail.com',
                'password'         => Hash::make('Admin2026!'),
                'estado'           => 'activo',
                'fecha_registro'   => $now,
            ],
            [
                'cod_rol'          => 2,
                'nombre'           => 'Daner',
                'apellido_paterno' => 'Escobar',
                'apellido_materno' => 'Guia',
                'email'            => 'escobardaner47@gmail.com',
                'password'         => Hash::make('Guia2026!'),
                'estado'           => 'activo',
                'fecha_registro'   => $now,
            ],
            [
                'cod_rol'          => 3,
                'nombre'           => 'Daner',
                'apellido_paterno' => 'Escobar',
                'apellido_materno' => 'Turista',
                'email'            => 'escobardaner49@gmail.com',
                'password'         => Hash::make('Turista2026!'),
                'estado'           => 'activo',
                'fecha_registro'   => $now,
            ],
            [
                'cod_rol'          => 4,
                'nombre'           => 'Daner',
                'apellido_paterno' => 'Escobar',
                'apellido_materno' => 'Oficina',
                'email'            => 'lpze.daner.escobar.co@unifranz.edu.bo',
                'password'         => Hash::make('Oficina2026!'),
                'estado'           => 'activo',
                'fecha_registro'   => $now,
            ],
        ];

        foreach ($usuarios as $usuario) {
            DB::table('usuarios')->updateOrInsert(
                ['email' => $usuario['email']],
                $usuario
            );
        }

        $this->command->info('');
        $this->command->info('✅ Usuarios de prueba actualizados.');
        $this->command->table(
            ['Rol', 'Email', 'Contrasena'],
            [
                ['Administrador',  'escobardaner48@gmail.com',              'Admin2026!'],
                ['Guia Turistico', 'escobardaner47@gmail.com',              'Guia2026!'],
                ['Turista',        'escobardaner49@gmail.com',              'Turista2026!'],
                ['Oficinista',     'lpze.daner.escobar.co@unifranz.edu.bo', 'Oficina2026!'],
            ]
        );
    }
}