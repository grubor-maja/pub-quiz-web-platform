<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Member extends Model
{
    protected $fillable = ['organization_id', 'user_id', 'role'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
