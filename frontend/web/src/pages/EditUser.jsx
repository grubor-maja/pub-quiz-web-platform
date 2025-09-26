import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function EditUser() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/manage/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setFormData({
          name: data.name,
          email: data.email,
          role: data.role
        })
      } else {
        setError('Failed to fetch user')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/manage/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
        alert('User updated successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update user')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const toggleRole = () => {
    setFormData(prev => ({
      ...prev,
      role: prev.role === 'USER' ? 'SUPER_ADMIN' : 'USER'
    }))
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            Loading user...
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>User not found</h3>
            <p>The user you're looking for doesn't exist or you don't have permission to access them.</p>
            <button 
              onClick={() => navigate('/manage/users')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Edit User</h1>
          <button 
            onClick={() => navigate('/manage/users')}
            className="btn btn-secondary"
          >
            ← Back to Users
          </button>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">User Information</h2>
            <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px', margin: '8px 0 0' }}>
              Update user details and manage their system permissions.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter full name"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter email address"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">User Role</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                <div style={{ 
                  padding: '12px 20px', 
                  borderRadius: '6px',
                  background: formData.role === 'USER' ? 'rgba(33, 74, 156, 0.15)' : 'rgba(220, 53, 69, 0.15)',
                  color: formData.role === 'USER' ? '#214a9c' : '#dc3545',
                  border: `1px solid ${formData.role === 'USER' ? 'rgba(33, 74, 156, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`,
                  fontWeight: '600',
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  {formData.role}
                </div>
                
                <button 
                  type="button"
                  onClick={toggleRole}
                  className="btn btn-secondary btn-sm"
                >
                  Toggle Role
                </button>
              </div>
              
              <small style={{ 
                color: 'rgba(228, 230, 234, 0.6)', 
                display: 'block', 
                marginTop: '8px',
                fontSize: '12px'
              }}>
                {formData.role === 'USER' 
                  ? 'Regular user with limited permissions'
                  : 'Super Admin with full system access'
                }
              </small>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/users')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>

          <div className="card" style={{ marginTop: '32px', background: 'rgba(33, 74, 156, 0.05)', borderColor: 'rgba(33, 74, 156, 0.2)' }}>
            <h3 className="card-subtitle" style={{ color: '#214a9c', marginTop: 0 }}>📊 User Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>User ID</div>
                <div style={{ fontWeight: '600', color: '#214a9c' }}>#{user.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>Created</div>
                <div style={{ fontWeight: '500' }}>{new Date(user.created_at).toLocaleDateString('sr-RS')}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>Last Updated</div>
                <div style={{ fontWeight: '500' }}>{new Date(user.updated_at).toLocaleDateString('sr-RS')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUser