<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'capacity',
        'fee',
        'contact_phone',
        'created_by',
    ];   

    protected $casts = [
        'date' => 'date',
        'min_team_size' => 'integer',
        'max_team_size' => 'integer',
        'capacity' => 'integer',
        'fee' => 'decimal:2',
        'organization_id' => 'integer',
        'created_by' => 'integer',
    ];

    /**
     * Get the teams registered for this quiz
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'quiz_teams')
                    ->withPivot('registered_at', 'status', 'final_position')
                    ->withTimestamps();
    }

    /**
     * Get the number of registered teams (only active registrations)
     */
    public function getRegisteredTeamsCountAttribute(): int
    {
        return $this->teams()->wherePivot('status', 'registered')->count();
    }

    /**
     * Get remaining capacity for this quiz
     */
    public function getRemainingCapacityAttribute(): ?int
    {
        if (is_null($this->capacity)) {
            return null;
        }
        
        return max(0, $this->capacity - $this->registered_teams_count);
    }

    /**
     * Check if quiz has available spots
     */
    public function hasAvailableSpots(): bool
    {
        if (is_null($this->capacity)) {
            return true; // No capacity limit
        }
        
        return $this->remaining_capacity > 0;
    }
}
