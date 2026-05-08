<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paquetes_turisticos', function (Blueprint $table) {
            $table->text('foto_principal')->nullable()->after('estado');
            $table->text('acerca_de')->nullable()->after('foto_principal');
            $table->text('que_esperar')->nullable()->after('acerca_de');
            $table->jsonb('itinerario')->nullable()->after('que_esperar');
            $table->jsonb('incluye')->nullable()->after('itinerario');
            $table->jsonb('no_incluye')->nullable()->after('incluye');
        });
    }

    public function down(): void
    {
        Schema::table('paquetes_turisticos', function (Blueprint $table) {
            $table->dropColumn([
                'foto_principal', 'acerca_de', 'que_esperar',
                'itinerario', 'incluye', 'no_incluye'
            ]);
        });
    }
};
