<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'member_count',
        'contact_phone',
        'contact_email',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'member_count' => 'integer',
        'organization_id' => 'integer',
        'created_by' => 'integer',
    ];

    /**
     * Get the quizzes that this team is registered for
     */
    public function quizzes(): BelongsToMany
    {
        return $this->belongsToMany(Quiz::class, 'quiz_teams')
                    ->withPivot('registered_at', 'status', 'final_position')
                    ->withTimestamps();
    }
    
    /**
     * Get the leagues that this team participates in
     */
    public function leagues(): BelongsToMany
    {
        return $this->belongsToMany(League::class, 'league_teams')
                    ->withPivot('total_points', 'matches_played', 'wins', 'draws', 'losses')
                    ->withTimestamps();
    }
    
    /**
     * Get league rounds for this team
     */
    public function leagueRounds()
    {
        return $this->hasMany(LeagueRound::class);
    }
}
