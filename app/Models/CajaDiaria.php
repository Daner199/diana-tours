<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaDiaria extends Model
{
    protected $table      = 'cajas_diarias';
    protected $primaryKey = 'cod';
    public    $timestamps = false;

    protected $fillable = [
        'cod_administrador',
        'fecha_apertura',
        'fecha_cierre',
        'saldo_inicial',
        'saldo_final',
        'estado',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre'   => 'datetime',
        'saldo_inicial'  => 'float',
        'saldo_final'    => 'float',
    ];

    public function administrador()
    {
        return $this->belongsTo(User::class, 'cod_administrador', 'cod');
    }

    public function transacciones()
    {
        return $this->hasMany(TransaccionCaja::class, 'cod_caja', 'cod');
    }

    public function totalIngresos(): float
    {
        return (float) $this->transacciones()
            ->where('tipo_movimiento', 'ingreso')
            ->sum('monto');
    }

    public function totalEgresos(): float
    {
        return (float) $this->transacciones()
            ->where('tipo_movimiento', 'egreso')
            ->sum('monto');
    }

    public function saldoActual(): float
    {
        return $this->saldo_inicial + $this->totalIngresos() - $this->totalEgresos();
    }
}
