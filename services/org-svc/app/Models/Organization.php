<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = ['name', 'created_by'];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }
}
