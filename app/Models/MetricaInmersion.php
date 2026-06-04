<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricaInmersion extends Model
{
    protected $table      = 'metricas_inmersion';
    protected $primaryKey = 'cod';
    public    $timestamps = false;

    protected $fillable = [
        'cod_usuario',
        'cod_sitio',
        'tecnologia_usada',
        'duracion_segundos',
        'fecha_interaccion',
    ];

    protected $casts = [
        'fecha_interaccion' => 'datetime',
    ];
}
