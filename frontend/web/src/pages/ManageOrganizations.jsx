import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function ManageOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data || [])
      } else {
        setError('Failed to fetch organizations')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orgId) => {
    if (!confirm('Are you sure you want to delete this organization? This will also delete all its members and quizzes.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setOrganizations(organizations.filter(org => org.id !== orgId))
      } else {
        alert('Failed to delete organization')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            Loading organizations...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Manage Organizations</h1>
          <Link 
            to="/manage/organizations/add"
            className="btn btn-primary"
          >
            + Add New Organization
          </Link>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Organizations ({organizations.length})</h2>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Created By</th>
                <th>Members</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map(org => (
                <tr key={org.id}>
                  <td style={{ fontWeight: '600', color: '#214a9c' }}>#{org.id}</td>
                  <td style={{ fontWeight: '500' }}>{org.name}</td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>User #{org.created_by}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 'rgba(33, 74, 156, 0.15)',
                      color: '#214a9c',
                      border: '1px solid rgba(33, 74, 156, 0.3)'
                    }}>
                      {org.members_count || 0} members
                    </span>
                  </td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '13px' }}>
                    {new Date(org.created_at).toLocaleDateString('sr-RS')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/manage/organizations/edit/${org.id}`}
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
                        onClick={() => handleDelete(org.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {organizations.length === 0 && (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
              <h3>No organizations found</h3>
              <p>Start by creating your first organization to manage quizzes and members.</p>
              <Link 
                to="/manage/organizations/add" 
                className="btn btn-primary btn-lg" 
                style={{ marginTop: '24px' }}
              >
                Create Organization
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageOrganizations