<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class League extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'organization_id',
        'name',
        'season',
        'year',
        'total_rounds',
        'description',
        'is_active',
        'created_by'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'year' => 'integer',
        'total_rounds' => 'integer'
    ];
    
    // Relationship: League belongs to many Teams
    public function teams()
    {
        return $this->belongsToMany(Team::class, 'league_teams')
                    ->withPivot('total_points', 'matches_played', 'wins', 'draws', 'losses')
                    ->withTimestamps();
    }
    
    // Relationship: League has many LeagueRounds
    public function rounds()
    {
        return $this->hasMany(LeagueRound::class);
    }
    
    // Get league table (teams ordered by points)
    public function getTableAttribute()
    {
        return $this->teams()
                   ->orderByPivot('total_points', 'desc')
                   ->orderByPivot('wins', 'desc')
                   ->get();
    }
    
    // Get current completed rounds
    public function getCompletedRoundsAttribute()
    {
        return $this->rounds()
                   ->select('round_number')
                   ->distinct()
                   ->count();
    }
    
    // Check if specific round is completed (all teams have results)
    public function isRoundCompleted($roundNumber)
    {
        $teamsInLeague = $this->teams()->count();
        $resultsInRound = $this->rounds()
                              ->where('round_number', $roundNumber)
                              ->count();
        
        return $resultsInRound === $teamsInLeague && $teamsInLeague > 0;
    }
    
    // Get next round number
    public function getNextRoundAttribute()
    {
        $completedRounds = $this->completed_rounds;
        return $completedRounds < $this->total_rounds ? $completedRounds + 1 : null;
    }
    
    // Recalculate team statistics
    public function recalculateTeamStats()
    {
        foreach ($this->teams as $team) {
            $rounds = $this->rounds()->where('team_id', $team->id)->get();
            
            $totalPoints = $rounds->sum('points');
            $matchesPlayed = $rounds->count();
            
            // Update pivot table
            $this->teams()->updateExistingPivot($team->id, [
                'total_points' => $totalPoints,
                'matches_played' => $matchesPlayed
            ]);
        }
    }
}space App\Models;

use Illuminate\Database\Eloquent\Model;

class League extends Model
{
    //
}
