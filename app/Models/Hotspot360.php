<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hotspot360 extends Model
{
    protected $table      = 'hotspots_360';
    protected $primaryKey = 'cod';
    public    $timestamps = false;

    protected $fillable = [
        'cod_escena',
        'tipo_interaccion',
        'posicion_x',
        'posicion_y',
        'texto_informativo',
        'cod_escena_destino',
    ];

    protected $casts = [
        'posicion_x' => 'float',
        'posicion_y' => 'float',
    ];

    public function escena()
    {
        return $this->belongsTo(Escena360::class, 'cod_escena', 'cod');
    }

    public function escenaDestino()
    {
        return $this->belongsTo(Escena360::class, 'cod_escena_destino', 'cod');
    }
}
