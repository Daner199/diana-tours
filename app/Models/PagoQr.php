<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoQr extends Model
{
    protected $table = 'pagos_qr';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_pago',
        'comprobante_url',
    ];
}
