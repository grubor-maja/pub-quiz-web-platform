<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Team;
use App\Models\Quiz;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Set up test headers for internal authentication
        $this->withHeaders([
            'X-Internal-Auth' => 'devsecret123',
            'X-User-Id' => '1'
        ]);
    }

    public function test_can_create_team()
    {
        $teamData = [
            'organization_id' => 1,
            'name' => 'Test Team',
            'member_count' => 4,
            'contact_phone' => '+381234567890',
            'contact_email' => 'test@example.com',
            'notes' => 'Test notes'
        ];

        $response = $this->postJson('/api/internal/teams', $teamData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'id', 'organization_id', 'name', 'member_count', 
                    'contact_phone', 'contact_email', 'notes', 'created_by'
                ]);

        $this->assertDatabaseHas('teams', [
            'name' => 'Test Team',
            'organization_id' => 1
        ]);
    }

    public function test_cannot_create_duplicate_team_name_in_organization()
    {
        // Create first team
        Team::create([
            'organization_id' => 1,
            'name' => 'Duplicate Name',
            'member_count' => 3,
            'created_by' => 1
        ]);

        // Try to create another team with same name in same organization
        $response = $this->postJson('/api/internal/teams', [
            'organization_id' => 1,
            'name' => 'Duplicate Name',
            'member_count' => 4
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['name']);
    }

    public function test_can_create_team_with_same_name_in_different_organization()
    {
        // Create team in organization 1
        Team::create([
            'organization_id' => 1,
            'name' => 'Same Name',
            'member_count' => 3,
            'created_by' => 1
        ]);

        // Create team with same name in organization 2 - should work
        $response = $this->postJson('/api/internal/teams', [
            'organization_id' => 2,
            'name' => 'Same Name',
            'member_count' => 4
        ]);

        $response->assertStatus(201);
    }

    public function test_can_register_team_for_quiz()
    {
        $team = Team::create([
            'organization_id' => 1,
            'name' => 'Quiz Team',
            'member_count' => 4,
            'created_by' => 1
        ]);

        $quiz = Quiz::create([
            'organization_id' => 1,
            'title' => 'Test Quiz',
            'venue' => 'Test Venue',
            'date' => '2025-12-01',
            'time' => '20:00',
            'min_team_size' => 2,
            'max_team_size' => 6,
            'capacity' => 10,
            'created_by' => 1
        ]);

        $response = $this->postJson("/api/internal/teams/{$team->id}/register-quiz", [
            'quiz_id' => $quiz->id
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure(['message', 'remaining_capacity']);

        $this->assertDatabaseHas('quiz_teams', [
            'quiz_id' => $quiz->id,
            'team_id' => $team->id,
            'status' => 'registered'
        ]);
    }

    public function test_cannot_register_team_for_full_quiz()
    {
        $team = Team::create([
            'organization_id' => 1,
            'name' => 'Late Team',
            'member_count' => 4,
            'created_by' => 1
        ]);

        $quiz = Quiz::create([
            'organization_id' => 1,
            'title' => 'Full Quiz',
            'venue' => 'Test Venue',
            'date' => '2025-12-01',
            'time' => '20:00',
            'min_team_size' => 2,
            'max_team_size' => 6,
            'capacity' => 1,
            'created_by' => 1
        ]);

        // Register first team
        $firstTeam = Team::create([
            'organization_id' => 1,
            'name' => 'First Team',
            'member_count' => 3,
            'created_by' => 1
        ]);
        
        $quiz->teams()->attach($firstTeam->id, [
            'registered_at' => now(),
            'status' => 'registered'
        ]);

        // Try to register second team (should fail)
        $response = $this->postJson("/api/internal/teams/{$team->id}/register-quiz", [
            'quiz_id' => $quiz->id
        ]);

        $response->assertStatus(400)
                ->assertJson(['message' => 'Quiz is full. No available spots.']);
    }

    public function test_quiz_capacity_calculations()
    {
        $quiz = Quiz::create([
            'organization_id' => 1,
            'title' => 'Capacity Test',
            'venue' => 'Test Venue',
            'date' => '2025-12-01',
            'time' => '20:00',
            'min_team_size' => 2,
            'max_team_size' => 6,
            'capacity' => 5,
            'created_by' => 1
        ]);

        // Register 3 teams
        for ($i = 1; $i <= 3; $i++) {
            $team = Team::create([
                'organization_id' => 1,
                'name' => "Team $i",
                'member_count' => 4,
                'created_by' => 1
            ]);
            
            $quiz->teams()->attach($team->id, [
                'registered_at' => now(),
                'status' => 'registered'
            ]);
        }

        $quiz->refresh();
        
        $this->assertEquals(3, $quiz->registered_teams_count);
        $this->assertEquals(2, $quiz->remaining_capacity);
        $this->assertTrue($quiz->hasAvailableSpots());
    }
}
