const API_BASE_URL = 'http://localhost:8000/api'

// Helper function to handle API responses
const handleApiResponse = async (response) => {
  const contentType = response.headers.get('Content-Type')
  
  if (!response.ok) {
    let errorMessage
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`
      }
    } else {
      const text = await response.text()
      if (text.includes('<!DOCTYPE')) {
        errorMessage = `Backend service unavailable (port 8000 not running?)`
      } else {
        errorMessage = `HTTP error! status: ${response.status}`
      }
    }
    throw new Error(errorMessage)
  }
  
  if (contentType && contentType.includes('application/json')) {
    return await response.json()
  } else {
    throw new Error('Backend returned non-JSON response. Is the API service running?')
  }
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

// League CRUD operations
export const leagueService = {
  // Get all leagues (public)
  async getAllLeagues() {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching leagues:', error)
      throw error
    }
  },

  // Get leagues by organization
  async getLeaguesByOrganization(organizationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/leagues`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching leagues by organization:', error)
      throw error
    }
  },

  // Get league by ID
  async getLeague(leagueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching league:', error)
      throw error
    }
  },

  // Alias for backward compatibility
  async getLeagueById(leagueId) {
    return this.getLeague(leagueId)
  },

  // Create new league
  async createLeague(leagueData) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(leagueData),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error creating league:', error)
      throw error
    }
  },

  // Update league
  async updateLeague(leagueId, leagueData) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(leagueData),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error updating league:', error)
      throw error
    }
  },

  // Delete league
  async deleteLeague(leagueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      
      // Handle 204 No Content response (successful deletion)
      if (response.status === 204) {
        return true
      }
      
      // For other successful responses, try to parse JSON
      if (response.ok) {
        try {
          return await response.json()
        } catch {
          return true // If no JSON, just return success
        }
      }

      // Handle errors using the standard error handler
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error deleting league:', error)
      throw error
    }
  },

  // Add team to league
  async addTeamToLeague(leagueId, teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ team_id: teamId }),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error adding team to league:', error)
      throw error
    }
  },

  // Remove team from league
  async removeTeamFromLeague(leagueId, teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/teams/${teamId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error removing team from league:', error)
      throw error
    }
  },

  // Enter round results
  async enterRoundResults(leagueId, roundData) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/rounds`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(roundData),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error entering round results:', error)
      throw error
    }
  },

  // Get league table
  async getLeagueTable(leagueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/table`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching league table:', error)
      throw error
    }
  },
}

// League validation helpers
export const leagueValidation = {
  validateLeagueName(name, existingLeagues = []) {
    if (!name || name.trim().length < 2) {
      return 'Naziv lige mora imati najmanje 2 karaktera'
    }
    
    if (name.length > 100) {
      return 'Naziv lige mora biti kraći od 100 karaktera'
    }
    
    return null
  },

  validateSeason(season) {
    const validSeasons = ['Prolece', 'Leto', 'Jesen', 'Zima']
    if (!validSeasons.includes(season)) {
      return 'Izaberite validnu sezonu'
    }
    return null
  },

  validateYear(year) {
    const currentYear = new Date().getFullYear()
    const numYear = parseInt(year)
    if (isNaN(numYear) || numYear < 2020 || numYear > currentYear + 5) {
      return `Godina mora biti između 2020 i ${currentYear + 5}`
    }
    return null
  },

  validateTotalRounds(rounds) {
    const numRounds = parseInt(rounds)
    if (isNaN(numRounds) || numRounds < 1 || numRounds > 50) {
      return 'Broj kola mora biti između 1 i 50'
    }
    return null
  },

  validateDescription(description) {
    if (description && description.length > 1000) {
      return 'Opis mora biti kraći od 1000 karaktera'
    }
    return null
  },

  // Validate entire league object
  validateLeague(leagueData, existingLeagues = []) {
    const errors = {}
    
    const nameError = this.validateLeagueName(leagueData.name, existingLeagues)
    if (nameError) errors.name = nameError
    
    const seasonError = this.validateSeason(leagueData.season)
    if (seasonError) errors.season = seasonError
    
    const yearError = this.validateYear(leagueData.year)
    if (yearError) errors.year = yearError
    
    const roundsError = this.validateTotalRounds(leagueData.total_rounds)
    if (roundsError) errors.total_rounds = roundsError
    
    const descriptionError = this.validateDescription(leagueData.description)
    if (descriptionError) errors.description = descriptionError
    
    return Object.keys(errors).length > 0 ? errors : null
  }
}