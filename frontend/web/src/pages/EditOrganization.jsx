import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function EditOrganization() {
  const [organization, setOrganization] = useState(null)
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newMember, setNewMember] = useState({ userId: '', role: 'MEMBER' })
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        setName(data.name)
      } else {
        setError('Failed to fetch organization')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data || [])
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

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
        const data = await response.json()
        setAllUsers(data || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/manage/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        alert('Organization updated successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update organization')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.userId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(newMember.userId),
          role: newMember.role
        }),
      })

      if (response.ok) {
        fetchMembers()
        setNewMember({ userId: '', role: 'MEMBER' })
        alert('Member added successfully!')
      } else {
        const errorData = await response.json()
        console.error('Add member error:', errorData)
        alert(`Failed to add member: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Add member network error:', err)
      alert('Network error: ' + err.message)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setMembers(members.filter(m => m.user_id !== userId))
        alert('Member removed successfully!')
      } else {
        const errorData = await response.json()
        console.error('Remove member error:', errorData)
        alert(`Failed to remove member: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Remove member network error:', err)
      alert('Network error: ' + err.message)
    }
  }

  useEffect(() => {
    fetchOrganization()
    fetchMembers()
    fetchUsers()
  }, [id])

  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.name : `User #${userId}`
  }

  const getUserEmail = (userId) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.email : ''
  }

  const availableUsers = allUsers.filter(user => 
    !members.some(member => member.user_id === user.id)
  )

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            Loading organization...
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>Organization not found</h3>
            <p>The organization you're looking for doesn't exist or you don't have permission to access it.</p>
            <button 
              onClick={() => navigate('/manage/organizations')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Back to Organizations
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
          <h1 className="page-title">Edit Organization</h1>
          <button 
            onClick={() => navigate('/manage/organizations')}
            className="btn btn-secondary"
          >
            ← Back to Organizations
          </button>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Organization Details</h2>
          </div>

          <form onSubmit={handleUpdateOrganization}>
            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control"
                placeholder="Enter organization name"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={saving || !name.trim()}
                className="btn btn-primary"
              >
                {saving ? 'Updating...' : 'Update Organization'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Organization Members ({members.length})</h2>
          </div>

          {availableUsers.length > 0 && (
            <form onSubmit={handleAddMember} style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'end', 
                flexWrap: 'wrap',
                padding: '24px',
                background: 'rgba(33, 74, 156, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(33, 74, 156, 0.1)'
              }}>
                <div className="form-group" style={{ minWidth: '250px', marginBottom: 0 }}>
                  <label className="form-label">Select User</label>
                  <select
                    value={newMember.userId}
                    onChange={(e) => setNewMember({...newMember, userId: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ minWidth: '120px', marginBottom: 0 }}>
                  <label className="form-label">Role</label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="form-control"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newMember.userId}
                >
                  Add Member
                </button>
              </div>
            </form>
          )}

          {members.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h3>No members yet</h3>
              <p>Add members to your organization to start managing quizzes together.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.user_id}>
                    <td style={{ fontWeight: '500' }}>{getUserName(member.user_id)}</td>
                    <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>{getUserEmail(member.user_id)}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(33, 74, 156, 0.15)',
                        color: member.role === 'ADMIN' ? '#dc3545' : '#214a9c',
                        border: `1px solid ${member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(33, 74, 156, 0.3)'}`
                      }}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditOrganization