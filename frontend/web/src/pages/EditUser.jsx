import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'

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
        alert('Korisnik je uspešno ažuriran!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Neuspešno ažuriranje korisnika')
      }
    } catch (err) {
      setError('Greška u mreži')
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
          <LoadingDragon />
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
            <h3>Korisnik nije pronađen</h3>
            <p>Korisnik kojeg tražite ne postoji ili nemate dozvolu za pristup njemu.</p>
            <button
              onClick={() => navigate('/manage/users')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Nazad na korisnike
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
          <h1 className="page-title">Izmeni korisnika</h1>
          <button
            onClick={() => navigate('/manage/users')}
            className="btn btn-secondary"
          >
            ← Nazad
          </button>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Podaci o korisniku</h2>
            <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px', margin: '8px 0 0' }}>
              Ažurirajte podatke korisnika i upravljajte njihovim pravima.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Ime i prezime *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Unesite ime i prezime"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email adresa *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Unesite email adresu"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Uloga korisnika</label>
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
                  Promeni ulogu
                </button>
              </div>
              
              <small style={{ 
                color: 'rgba(228, 230, 234, 0.6)', 
                display: 'block', 
                marginTop: '8px',
                fontSize: '12px'
              }}>
                {formData.role === 'USER' 
                  ? 'Obični korisnik sa ograničenim pravima'
                  : 'Super Admin sa punim pristupom sistemu'
                }
              </small>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/users')}
                className="btn btn-secondary"
              >
                Otkaži
              </button>
              
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Ažuriranje...' : 'Ažuriraj korisnika'}
              </button>
            </div>
          </form>

          <div className="card" style={{ marginTop: '32px', background: 'rgba(33, 74, 156, 0.05)', borderColor: 'rgba(33, 74, 156, 0.2)' }}>
            <h3 className="card-subtitle" style={{ color: '#214a9c', marginTop: 0 }}>📊 Statistika korisnika</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>Kreiran</div>
                <div style={{ fontWeight: '500' }}>{new Date(user.created_at).toLocaleDateString('sr-RS')}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>Admin status</div>
                <div style={{
                  fontWeight: '600',
                  color: formData.role === 'SUPER_ADMIN' ? '#dc3545' : '#28a745'
                }}>
                  {formData.role === 'SUPER_ADMIN' ? '🛡️ Super Admin' : '👤 Obični korisnik'}
                </div>
              </div>
              {user.organization_name && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.6)', textTransform: 'uppercase' }}>Organizacija</div>
                  <div style={{ fontWeight: '500', color: '#28a745' }}>🏢 {user.organization_name}</div>
                  {user.organization_role && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: user.organization_role === 'ADMIN' ? '#856404' : '#155724',
                      marginTop: '2px'
                    }}>
                      {user.organization_role === 'ADMIN' ? '👑 Administrator organizacije' : '👤 Član organizacije'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUser