import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AddOrganization() {
  const [name, setName] = useState('')
  const [adminUserId, setAdminUserId] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/manage/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const users = await response.json()
        setAllUsers(users)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/manage/organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          admin_user_id: adminUserId 
        }),
      })

      if (response.ok) {
        navigate('/manage/organizations')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create organization')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Add New Organization</h1>
          <button 
            onClick={() => navigate('/manage/organizations')}
            className="btn btn-secondary"
          >
            ← Back to Organizations
          </button>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Organization Information</h2>
            <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px', margin: '8px 0 0' }}>
              Create a new organization to manage quizzes and members.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control"
                placeholder="Enter organization name (e.g. Belgrade Quiz Club)"
                style={{ fontSize: '16px' }}
              />
              <small style={{ 
                color: 'rgba(228, 230, 234, 0.6)', 
                fontSize: '12px', 
                display: 'block', 
                marginTop: '6px' 
              }}>
                Choose a memorable name that represents your quiz organization.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Organization Admin *</label>
              <select
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
                required
                className="form-control"
                style={{ fontSize: '16px' }}
              >
                <option value="">Select admin user...</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <small style={{ 
                color: 'rgba(228, 230, 234, 0.6)', 
                fontSize: '12px', 
                display: 'block', 
                marginTop: '6px' 
              }}>
                This user will be the administrator of this organization.
              </small>
            </div>

            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/organizations')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={loading || !name.trim() || !adminUserId}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>

          <div className="card" style={{ marginTop: '32px', background: 'rgba(33, 74, 156, 0.05)', borderColor: 'rgba(33, 74, 156, 0.2)' }}>
            <h3 className="card-subtitle" style={{ color: '#214a9c', marginTop: 0 }}>💡 What's Next?</h3>
            <ul style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>After creating, you can add members to your organization</li>
              <li style={{ marginBottom: '8px' }}>Members can be assigned ADMIN or MEMBER roles</li>
              <li style={{ marginBottom: '8px' }}>Only organization members can create and manage quizzes</li>
              <li>ADMINs can manage other members in the organization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddOrganization