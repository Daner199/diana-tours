<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DispositivoConfiable extends Model
{
    protected $table = 'dispositivos_confiables';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_usuario',
        'token_dispositivo',
        'nombre_dispositivo',
        'expira_en',
    ];

    protected $casts = [
        'expira_en' => 'datetime',
    ];
}
