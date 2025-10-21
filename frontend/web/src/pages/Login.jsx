import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
          console.log(result);
        navigate('/')
      } else {
        setError(result.error || 'Prijava neuspešna')
      }
    } catch (err) {
      setError(err.message || 'Prijava neuspešna')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-content">
      <div className="container-fluid" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 80px)' 
      }}>
        <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="card-header" style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <img 
                src="/logo1.png" 
                alt="Dragon Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px' 
                }} 
              />
              <h2 style={{
                fontSize: '24px',
                fontFamily: "'Unkempt', cursive",
                fontWeight: 'bold',
                margin: 0,
                display: 'inline',
                whiteSpace: 'nowrap'
              }}>
                Dobrodosli na{' '}
                <span style={{ color: '#94994F' }}>Ko</span>
                <span style={{ color: '#F2E394' }}>Zna</span>
                <span style={{ color: '#F2B441' }}>Zna</span>
                {' '}platformu
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email adresa</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Email adresa"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lozinka</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Lozinka"
                style={{ fontSize: '16px' }}
              />
            </div>

            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0, fontSize: '14px' }}> {error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '24px' }}
            >
              {loading ? 'Prijavljivanje...' : 'Prijavite se'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px' }}>
                Nemate nalog?{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    color: '#214a9c', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Registrujte se ovde
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login