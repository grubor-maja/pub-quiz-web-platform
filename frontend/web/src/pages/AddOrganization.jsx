import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaLightbulb } from 'react-icons/fa';
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
        // Show success alert with organization name
        alert(`Uspešno je kreirana organizacija "${name}"!`)
        
        // Redirect to organizations page
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
          <h1 className="page-title"><FaLightbulb/> Dodaj novu organizaciju</h1>
          <button
            onClick={() => navigate('/manage/organizations')}
            className="btn btn-secondary"
          >
            ← Nazad
          </button>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Informacije o organizaciji</h2>

          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Naziv organizacije *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control"
                placeholder="Unesite naziv organizacije (npr. Beogradski kviz klub)"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Administrator organizacije *</label>
              <select
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
                required
                className="form-control"
                style={{
                  fontSize: '16px',
                  background: 'rgba(26, 31, 41, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e4e6ea'
                }}
              >
                <option value="" style={{ background: '#2c2c2c', color: '#e4e6ea' }}>
                  Izaberite admin korisnika...
                </option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id} style={{ background: '#2c2c2c', color: '#e4e6ea' }}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

            </div>

            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0 }}> {error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/organizations')}
                className="btn btn-secondary"
              >
                Otkaži
              </button>
              
              <button 
                type="submit" 
                disabled={loading || !name.trim() || !adminUserId}
                className="btn btn-primary"
              >
                {loading ? 'Kreiranje...' : 'Kreiraj organizaciju'}
              </button>
            </div>
          </form>

          <div className="card" style={{ marginTop: '32px', background: 'rgba(33, 74, 156, 0.05)', borderColor: 'rgba(33, 74, 156, 0.2)' }}>
            <h3 className="card-subtitle" style={{ color: '#214a9c', marginTop: 0 }}><FaLightbulb/> Šta sledi?</h3>
            <ul style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Nakon kreiranja, možete dodati članove u Vašu organizaciju</li>
              <li style={{ marginBottom: '8px' }}>Članovima se mogu dodeliti ADMIN ili MEMBER uloge</li>
              <li style={{ marginBottom: '8px' }}>Samo članovi organizacije mogu kreirati i upravljati kvizovima</li>
              <li>ADMINI mogu upravljati drugim članovima u organizaciji</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddOrganization