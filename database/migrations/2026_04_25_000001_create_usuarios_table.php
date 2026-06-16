<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('cod');
            $table->string('nombre', 50)->unique();
            $table->string('descripcion', 150)->nullable();
        });

        Schema::create('usuarios', function (Blueprint $table) {
            $table->increments('cod');
            $table->unsignedInteger('cod_rol');
            $table->string('nombre', 50);
            $table->string('apellido_paterno', 50);
            $table->string('apellido_materno', 50)->nullable();
            $table->string('email', 100)->unique();
            $table->string('password');
            $table->string('telefono', 20)->nullable();
            $table->string('foto_perfil')->nullable();
            $table->enum('estado', ['activo', 'inactivo', 'bloqueado'])->default('inactivo');
            $table->timestamp('fecha_registro')->useCurrent();
            $table->foreign('cod_rol')->references('cod')->on('roles')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('roles');
    }
};