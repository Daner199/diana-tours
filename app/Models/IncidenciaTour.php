<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidenciaTour extends Model
{
    protected $table = 'incidencias_tour';
    protected $primaryKey = 'cod';
    public $timestamps = false;

    protected $fillable = [
        'cod_grupo',
        'descripcion',
        'nivel_gravedad',
        'fecha_reporte',
    ];

    public function grupo()
    {
        return $this->belongsTo(GrupoOperativo::class, 'cod_grupo', 'cod');
    }
}
