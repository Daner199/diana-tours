<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaqueteTuristico extends Model
{
    protected $table = 'paquetes_turisticos';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'precio_bs',
        'duracion_horas',
        'estado',
        'foto_principal',
        'acerca_de',
        'que_esperar',
        'itinerario',
        'incluye',
        'no_incluye',
    ];

   protected $casts = [
    'precio_bs'      => 'float',
    'duracion_horas' => 'float',
    'itinerario'     => 'array',
    'incluye'        => 'array',
    'no_incluye'     => 'array',
];

    public function sitios()
    {
        return $this->belongsToMany(
            SitioTuristico::class,
            'paquete_sitio',
            'cod_paquete',
            'cod_sitio',
            'cod',
            'cod'
        )->withPivot('cod');
    }
}
