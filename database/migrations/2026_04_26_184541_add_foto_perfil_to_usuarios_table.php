<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Agrega la columna después de 'estado'
            $table->text('foto_perfil')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Por si algún día quieres deshacer este cambio
            $table->dropColumn('foto_perfil');
        });
    }
};
