<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Escena360 extends Model
{
    protected $table = 'escenas_360';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_sitio',
        'nombre',
        'archivo_imagen_url',
        'es_inicio',
    ];
}
