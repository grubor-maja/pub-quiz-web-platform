import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

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
        setUsers(data || [])
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId) => {
    console.log('Current user:', user) // Debug info
    console.log('Attempting to delete user ID:', userId)
    
    if (userId === user.id) {
      alert("You cannot delete yourself!")
      return
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      console.log('Token exists:', !!token) // Debug info
      
      const response = await fetch(`http://localhost:8000/api/manage/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      console.log('Delete response status:', response.status) // Debug info
      console.log('Delete response headers:', response.headers) // Debug info

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        alert('User deleted successfully!')
      } else {
        const errorData = await response.json()
        console.error('Delete error:', errorData)
        alert(`Failed to delete user: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Network error:', err)
      alert('Network error: ' + err.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            Loading users...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Manage Users</h1>
          <Link 
            to="/manage/users/add"
            className="btn btn-primary"
          >
            + Add New User
          </Link>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Users ({users.length})</h2>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>System Role</th>
                <th>Organization</th>
                <th>Org Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: '600', color: '#214a9c' }}>#{user.id}</td>
                  <td style={{ fontWeight: '500' }}>{user.name}</td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>{user.email}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: user.role === 'SUPER_ADMIN' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(33, 74, 156, 0.15)',
                      color: user.role === 'SUPER_ADMIN' ? '#dc3545' : '#214a9c',
                      border: `1px solid ${user.role === 'SUPER_ADMIN' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(33, 74, 156, 0.3)'}`
                    }}>
                      {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td>
                    {user.organization_name ? (
                      <span style={{ 
                        color: '#28a745',
                        fontWeight: '500'
                      }}>
                        🏢 {user.organization_name}
                      </span>
                    ) : (
                      <span style={{ 
                        color: 'rgba(228, 230, 234, 0.5)',
                        fontStyle: 'italic'
                      }}>
                        No organization
                      </span>
                    )}
                  </td>
                  <td>
                    {user.organization_role ? (
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: user.organization_role === 'ADMIN' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(40, 167, 69, 0.15)',
                        color: user.organization_role === 'ADMIN' ? '#856404' : '#155724',
                        border: `1px solid ${user.organization_role === 'ADMIN' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
                      }}>
                        {user.organization_role === 'ADMIN' ? '👑 ADMIN' : '👤 MEMBER'}
                      </span>
                    ) : user.organization_name ? (
                      <span style={{ 
                        color: 'rgba(228, 230, 234, 0.5)',
                        fontSize: '11px'
                      }}>
                        Unknown
                      </span>
                    ) : (
                      <span style={{ 
                        color: 'rgba(228, 230, 234, 0.3)',
                        fontSize: '11px'
                      }}>
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '13px' }}>
                    {new Date(user.created_at).toLocaleDateString('sr-RS')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/manage/users/edit/${user.id}`}
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#e4e6ea',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        ✏️ Edit
                      </Link>
                      <button 
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === user.id}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h3>No users found</h3>
              <p>Start by adding your first user to the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageUsers