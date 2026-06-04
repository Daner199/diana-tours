<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class GrupoOperativo extends Model
{
    protected $table = 'grupos_operativos';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_paquete',
        'fecha_salida',
        'aforo_minimo',
        'aforo_maximo',
        'estado',
    ];

    public function paquete()
    {
        return $this->belongsTo(PaqueteTuristico::class, 'cod_paquete', 'cod');
    }

    public function asignacion()
    {
        return $this->hasOne(AsignacionLogistica::class, 'cod_grupo', 'cod');
    }

    public function incidencias()
    {
        return $this->hasMany(IncidenciaTour::class, 'cod_grupo', 'cod');
    }

    public function pasajeros()
    {
        return $this->hasManyThrough(
            User::class,
            Reserva::class,
            'cod_paquete', // FK en reservas apuntando a paquete
            'cod',         // FK en usuarios
            'cod_paquete', // llave local en grupos
            'cod_turista'  // llave en reservas
        );
    }
}
