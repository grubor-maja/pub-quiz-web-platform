import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AddUser() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'USER'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.password_confirmation) {
      setError('Lozinke se ne poklapaju')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/manage/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        navigate('/manage/users')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Neuspešno kreiranje korisnika')
      }
    } catch (err) {
      setError('Greška u mreži')
    } finally {
      setLoading(false)
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

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Dodaj novog korisnika</h1>
          <button
            onClick={() => navigate('/manage/users')}
            className="btn btn-secondary"
          >
            ← Nazad
          </button>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Podaci o korisniku</h2>
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
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lozinka *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                className="form-control"
                placeholder="Unesite lozinku (min 8 karaktera)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Potvrdite lozinku *</label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                minLength="8"
                className="form-control"
                placeholder="Potvrdite lozinku"
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
                onClick={() => navigate('/manage/users')}
                className="btn btn-secondary"
              >
                Otkaži
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Kreiranje...' : 'Kreiraj korisnika'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddUser