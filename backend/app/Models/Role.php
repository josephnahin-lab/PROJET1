<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['code', 'description'])]
class Role extends Model
{
    protected $primaryKey = 'code';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';
}
