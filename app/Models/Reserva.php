<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reserva extends Model
{
    protected $table = 'reservas';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_turista',
        'cod_paquete',
        'fecha_reserva',
        'cantidad_pasajeros',
        'estado',
    ];

    public function paquete()
    {
        return $this->belongsTo(PaqueteTuristico::class, 'cod_paquete', 'cod');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'cod_reserva', 'cod');
    }

    public function turista()
    {
        return $this->belongsTo(User::class, 'cod_turista', 'cod');
    }
}
