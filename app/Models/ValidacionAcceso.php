<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValidacionAcceso extends Model
{
    protected $table = 'validaciones_acceso';
    protected $primaryKey = 'cod';
    public $timestamps = false;
    protected $fillable = [
        'cod_usuario',
        'codigo_verificacion',
        'expira_en',
        'usado',
    ];

    protected $casts = [
        'usado' => 'boolean',
        'expira_en' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'cod_usuario', 'cod');
    }
}
