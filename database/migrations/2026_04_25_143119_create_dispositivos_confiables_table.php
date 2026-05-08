<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispositivos_confiables', function (Blueprint $table) {
            // AQUÍ ESTÁ LA MAGIA: 'increments' es el equivalente exacto a 'SERIAL PRIMARY KEY'
            $table->increments('cod');

            $table->integer('cod_usuario');
            $table->string('token_dispositivo', 255);
            $table->string('nombre_dispositivo', 100)->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
            $table->timestamp('expira_en')->nullable();

            // Relación con tu tabla 'usuarios' usando 'cod'
            $table->foreign('cod_usuario')
                  ->references('cod')
                  ->on('usuarios')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispositivos_confiables');
    }
};
