<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoTarjeta extends Model
{
    protected $table = 'pagos_tarjetas';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_pago',
        'titular',
        'numero_cifrado',
        'mes_expiracion',
        'anio_expiracion'
    ];

    // LA MAGIA ESTÁ AQUÍ: Laravel cifrará (AES-256) este campo al guardar y lo descifrará al leer
    protected $casts = [
        'numero_cifrado' => 'encrypted',
    ];
}
