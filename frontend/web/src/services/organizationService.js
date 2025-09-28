const API_BASE_URL = 'http://localhost:8000/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export const organizationService = {
  async getAllOrganizations() {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch organizations')
      }

      return await response.json()
    } catch (error) {
      console.error('Get organizations error:', error)
      throw error
    }
  },

  async getOrganization(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch organization')
      }

      return await response.json()
    } catch (error) {
      console.error('Get organization error:', error)
      throw error
    }
  }
}