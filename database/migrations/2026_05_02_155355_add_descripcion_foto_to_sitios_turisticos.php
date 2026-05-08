<?php
// database/migrations/xxxx_add_descripcion_foto_to_sitios_turisticos.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sitios_turisticos', function (Blueprint $table) {
            $table->text('descripcion')->nullable()->after('nombre');
            $table->text('foto')->nullable()->after('descripcion');
        });
    }

    public function down(): void {
        Schema::table('sitios_turisticos', function (Blueprint $table) {
            $table->dropColumn(['descripcion', 'foto']);
        });
    }
};
