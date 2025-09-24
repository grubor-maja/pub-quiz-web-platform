<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
     protected $fillable = [
        'organization_id',
        'title',
        'description',
        'image_url',
        'venue',
        'date',
        'time',
        'min_team_size',
        'max_team_size',
        'fee',
        'contact_phone',
        'created_by',
    ];   
}
