<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransaccionCaja extends Model
{
    protected $table      = 'transacciones_caja';
    protected $primaryKey = 'cod';
    public    $timestamps = false;

    protected $fillable = [
        'cod_caja',
        'tipo_movimiento',
        'monto',
        'descripcion',
        'fecha_transaccion',
    ];

    protected $casts = [
        'fecha_transaccion' => 'datetime',
        'monto'             => 'float',
    ];

    public function caja()
    {
        return $this->belongsTo(CajaDiaria::class, 'cod_caja', 'cod');
    }
}
