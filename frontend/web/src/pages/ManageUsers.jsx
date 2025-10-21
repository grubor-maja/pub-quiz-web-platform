import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import { FaRegEdit } from 'react-icons/fa'
import { RiDeleteBin6Line } from 'react-icons/ri'

function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
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
      alert("Ne možete obrisati sebe!")
      return
    }

    if (!confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
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
        alert('Korisnik je uspešno obrisan!')
      } else {
        const errorData = await response.json()
        console.error('Delete error:', errorData)
        alert(`Neuspešno brisanje korisnika: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (err) {
      console.error('Network error:', err)
      alert('Greška mreže: ' + err.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search query
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
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
          <h1 className="page-title">Upravljanje korisnicima</h1>
          <Link 
            to="/manage/users/add"
            className="btn btn-primary"
          >
            + Dodaj novog korisnika
          </Link>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Svi korisnici ({filteredUsers.length})</h2>
            <div style={{ marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Pretraži korisnika..."
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
                <th>Email</th>
                <th>Sistemska uloga</th>
                <th>Kreiran</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600', color: '#214a9c' }}>#{u.id}</td>
                  <td style={{ fontWeight: '500' }}>{u.name}</td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>{u.email}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: u.role === 'SUPER_ADMIN' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(33, 74, 156, 0.15)',
                      color: u.role === 'SUPER_ADMIN' ? '#dc3545' : '#214a9c',
                      border: `1px solid ${u.role === 'SUPER_ADMIN' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(33, 74, 156, 0.3)'}`
                    }}>
                      {u.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '13px' }}>
                    {new Date(u.created_at).toLocaleDateString('sr-RS')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/manage/users/edit/${u.id}`}
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#e4e6ea',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <FaRegEdit style={{ marginRight: '4px' }} />
                        Izmeni
                      </Link>
                      <button 
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user.id}
                      >
                        <RiDeleteBin6Line style={{ marginRight: '4px' }} />
                        Obriši
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h3>{searchQuery ? 'Nema pronađenih korisnika' : 'Nema pronađenih korisnika'}</h3>
              <p>{searchQuery ? 'Pokušajte sa drugom pretragom.' : 'Start by adding your first user to the system.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageUsers