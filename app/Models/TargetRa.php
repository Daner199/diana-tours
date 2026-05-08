<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetRa extends Model
{
    protected $table = 'targets_ra';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_sitio',
        'archivo_fachada_url',
        'nivel_confianza',
    ];
}
