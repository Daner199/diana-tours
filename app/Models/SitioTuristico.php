<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitioTuristico extends Model

{
    protected $table = 'sitios_turisticos';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'foto',
        'latitud',
        'longitud',
        'estado',
    ];

    public function paquetes()
    {
        return $this->belongsToMany(
            PaqueteTuristico::class,
            'paquete_sitio',
            'cod_sitio',
            'cod_paquete',
            'cod',
            'cod'
        )->withPivot('cod');
    }
    public function escenas360()
{
    return $this->hasMany(\App\Models\Escena360::class, 'cod_sitio', 'cod');
}

public function targetsRa()
{
    return $this->hasMany(\App\Models\TargetRa::class, 'cod_sitio', 'cod');
}
}
