<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsignacionLogistica extends Model
{
    protected $table = 'asignaciones_logistica';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_grupo',
        'cod_guia',
        'placa_transporte',
        'capacidad_transporte',
    ];

    public function grupo()
    {
        return $this->belongsTo(GrupoOperativo::class, 'cod_grupo', 'cod');
    }

    public function guia()
    {
        return $this->belongsTo(User::class, 'cod_guia', 'cod');
    }
}
