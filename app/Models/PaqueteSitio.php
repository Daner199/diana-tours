<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaqueteSitio extends Model
{
    protected $table = 'paquete_sitio';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_paquete',
        'cod_sitio',
    ];
}
