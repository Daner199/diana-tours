<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'cod';
 public $timestamps = false;
    protected $fillable = ['nombre', 'descripcion'];
}
