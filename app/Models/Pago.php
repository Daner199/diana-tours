<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_reserva',
        'monto_pagado',
        'metodo_pago',
        'estado',
        'fecha_pago',
    ];

    protected $casts = [
        'fecha_pago' => 'datetime',
    ];

    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'cod_reserva', 'cod');
    }

    public function detalleTarjeta()
    {
        return $this->hasOne(PagoTarjeta::class, 'cod_pago', 'cod');
    }

    public function detalleQr()
    {
        return $this->hasOne(PagoQr::class, 'cod_pago', 'cod');
    }
}
