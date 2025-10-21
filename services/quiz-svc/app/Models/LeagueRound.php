<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeagueRound extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'league_id',
        'round_number',
        'team_id',
        'points',
        'position',
        'notes',
        'played_at',
        'recorded_by'
    ];
    
    protected $casts = [
        'played_at' => 'datetime',
        'points' => 'integer',
        'position' => 'integer',
        'round_number' => 'integer'
    ];
    
    // Relationship: Round belongs to League
    public function league()
    {
        return $this->belongsTo(League::class);
    }
    
    // Relationship: Round belongs to Team
    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}
