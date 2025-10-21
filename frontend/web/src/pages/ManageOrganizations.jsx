import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import {FaLightbulb, FaRegEdit} from 'react-icons/fa'
import { RiDeleteBin6Line } from 'react-icons/ri'

function ManageOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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
        console.log('Fetched organizations:', data)
        setOrganizations(data || [])
      } else {
        setError('Failed to fetch organizations')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
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
        console.log('Fetched users:', data)
        setUsers(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleDelete = async (orgId) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu organizaciju? Brisanjem organizacije brišete i sve članove te organizacije.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/manage/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setOrganizations(organizations.filter(org => org.id !== orgId))
        alert('Organizacija uspešno obrisana.')
      } else {
        const errorData = await response.json()
        console.error('Delete organization error:', errorData)
        alert(`Neuspešno brisanje organizacije: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Mrežna greška prilikom brisanja organizacije:', err)
      alert('Mrežna greška: ' + err.message)
    }
  }

  const getUserById = (userId) => {
    return users.find(u => u.id === userId)
  }

  const getCreatorName = (org) => {
    if (!org || !org.created_by) return 'N/A'
    const creator = getUserById(org.created_by)
    return creator ? creator.name : `User #${org.created_by}`
  }

  useEffect(() => {
    fetchUsers()
    fetchOrganizations()
  }, [])

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || usersLoading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <LoadingDragon />
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Upravljanje organizacijama</h1>
          <Link 
            to="/manage/organizations/add"
            className="btn btn-primary"
          >
              <FaLightbulb/> Dodaj novu organizaciju
          </Link>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Sve organizacije ({filteredOrganizations.length})</h2>
            <div style={{ marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Pretraži organizaciju..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#e4e6ea',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.borderColor = '#214a9c'
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
              />
            </div>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ime</th>
                <th>Kreirao</th>
                <th>Datum kreiranja</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map(org => (
                <tr key={org.id}>
                  <td style={{ fontWeight: '600', color: '#214a9c' }}>#{org.id}</td>
                  <td>
                    <Link
                      to={`/manage/organizations/${org.id}`}
                      style={{
                        color: '#4a9eff',
                        fontWeight: '500',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>
                    {getCreatorName(org)}
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
                        <FaRegEdit style={{ marginRight: '4px' }} /> Izmeni
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
                        <RiDeleteBin6Line style={{ marginRight: '4px' }} /> Obriši
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrganizations.length === 0 && (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
              <h3>{searchQuery ? 'Nema pronađenih organizacija' : 'No organizations found'}</h3>
              <p>{searchQuery ? 'Pokušajte sa drugom pretragom.' : 'Start by creating your first organization to manage quizzes and members.'}</p>
              {!searchQuery && (
                <Link
                  to="/manage/organizations/add"
                  className="btn btn-primary btn-lg"
                  style={{ marginTop: '24px' }}
                >
                  Create Organization
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageOrganizations