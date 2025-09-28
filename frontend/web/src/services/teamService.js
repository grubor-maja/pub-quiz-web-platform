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
      // If we get HTML or other content, it might be a Laravel error page
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

// Team CRUD operations
export const teamService = {
  // Get teams by organization
  async getTeamsByOrganization(organizationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orgs/${organizationId}/teams`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching teams by organization:', error)
      throw error
    }
  },

  // Get team by ID
  async getTeamById(teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching team:', error)
      throw error
    }
  },

  // Create new team
  async createTeam(teamData) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(teamData),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  },

  // Update team
  async updateTeam(teamId, teamData) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(teamData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  },

  // Delete team
  async deleteTeam(teamId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return response.status === 204
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  },

  // Apply team for quiz (pending status)
  async applyTeamForQuiz(teamId, quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/apply-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quiz_id: quizId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error applying team for quiz:', error)
      throw error
    }
  },

  // Approve team application (admin only)
  async approveTeamApplication(teamId, quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/approve-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quiz_id: quizId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error approving team application:', error)
      throw error
    }
  },

  // Reject team application (admin only)
  async rejectTeamApplication(teamId, quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/reject-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quiz_id: quizId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error rejecting team application:', error)
      throw error
    }
  },

  // Unregister team from quiz
  async unregisterTeamFromQuiz(teamId, quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/unregister-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quiz_id: quizId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error unregistering team from quiz:', error)
      throw error
    }
  },

  // Get teams registered for a quiz
  async getQuizTeams(quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/teams`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching quiz teams:', error)
      throw error
    }
  },
}

// Quiz service extensions for capacity
export const quizService = {
  // Update quiz with capacity
  async updateQuizWithCapacity(quizId, quizData) {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(quizData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating quiz:', error)
      throw error
    }
  },

  // Create quiz with capacity
  async createQuizWithCapacity(quizData) {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quizData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating quiz:', error)
      throw error
    }
  },

  // Get quiz with team information
  async getQuizWithTeams(quizId) {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return await handleApiResponse(response)
    } catch (error) {
      console.error('Error fetching quiz with teams:', error)
      throw error
    }
  },
}

// Validation helpers
export const teamValidation = {
  validateTeamName(name, existingTeams = []) {
    if (!name || name.trim().length < 2) {
      return 'Team name must be at least 2 characters long'
    }
    
    if (name.length > 100) {
      return 'Team name must be less than 100 characters'
    }
    
    const trimmedName = name.trim().toLowerCase()
    const nameExists = existingTeams.some(team => 
      team.name.toLowerCase() === trimmedName
    )
    
    if (nameExists) {
      return 'Team name already exists in this organization'
    }
    
    return null
  },

  validateMemberCount(count) {
    const num = parseInt(count)
    if (isNaN(num) || num < 1 || num > 20) {
      return 'Member count must be between 1 and 20'
    }
    return null
  },

  validateEmail(email) {
    if (!email) return null // Email is optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  validatePhone(phone) {
    if (!phone) return null // Phone is optional
    
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  validateNotes(notes) {
    if (!notes) return null // Notes are optional
    
    if (notes.length > 1000) {
      return 'Notes must be less than 1000 characters'
    }
    return null
  },

  // Validate entire team object
  validateTeam(teamData, existingTeams = []) {
    const errors = {}
    
    const nameError = this.validateTeamName(teamData.name, existingTeams)
    if (nameError) errors.name = nameError
    
    const memberCountError = this.validateMemberCount(teamData.member_count)
    if (memberCountError) errors.member_count = memberCountError
    
    const emailError = this.validateEmail(teamData.contact_email)
    if (emailError) errors.contact_email = emailError
    
    const phoneError = this.validatePhone(teamData.contact_phone)
    if (phoneError) errors.contact_phone = phoneError
    
    const notesError = this.validateNotes(teamData.notes)
    if (notesError) errors.notes = notesError
    
    return Object.keys(errors).length > 0 ? errors : null
  }
}