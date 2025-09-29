import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { leagueService } from '../services/leagueService'
import { organizationService } from '../services/organizationService'
import { useAuth } from '../contexts/AuthContext'

function LeagueForm() {
  const { id } = useParams() // For editing existing league
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    season: 'Leto',
    year: new Date().getFullYear(),
    total_rounds: 10,
    description: '',
    organization_id: user?.organization_id || '',
    is_active: true
  })

  const [errors, setErrors] = useState({})
  
  const seasons = ['Prolece', 'Leto', 'Jesen', 'Zima']
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i)

  // Load organizations if super admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      organizationService.getAllOrganizations()
        .then(data => setOrganizations(data || []))
        .catch(err => console.error('Error loading organizations:', err))
    }
  }, [user?.role])

  // Load league data if editing
  useEffect(() => {
    if (isEdit && id) {
      leagueService.getLeague(id)
        .then(league => {
          setFormData({
            name: league.name || '',
            season: league.season || 'Leto',
            year: league.year || new Date().getFullYear(),
            total_rounds: league.total_rounds || 10,
            description: league.description || '',
            organization_id: league.organization_id || user?.organization_id || '',
            is_active: league.is_active !== undefined ? league.is_active : true
          })
        })
        .catch(err => {
          console.error('Error loading league:', err)
          setError('Greška pri učitavanju lige: ' + err.message)
        })
        .finally(() => setLoading(false))
    }
  }, [isEdit, id, user?.organization_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')

    try {
        console.log('=== DEBUG: User koji pokušava da kreira ligu ===');
        console.log('User object:', user);
        console.log('User organization_id:', user?.organization_id);
        console.log('User organization_role:', user?.organization_role);
        console.log('User role:', user?.role);
        console.log('FormData organization_id:', formData.organization_id);
        console.log('=== END DEBUG ===');
        
      // For admin users, automatically set their organization
      const dataToSend = {
        ...formData,
        user_id: user.id,
        organization_id: user?.organization_role === 'ADMIN' ? user.organization_id : formData.organization_id
      }

      console.log('Data to send:', dataToSend);

      if (isEdit) {
        await leagueService.updateLeague(id, dataToSend)
        setSuccess('Liga je uspešno ažurirana!')
      } else {
        await leagueService.createLeague(dataToSend)
        setSuccess('Liga je uspešno kreirana!')
      }

      // Redirect back after 1.5 seconds
      setTimeout(() => {
        navigate('/manage-leagues')
      }, 1500)
    } catch (err) {
      console.error('Save league error:', err)
      if (err.message.includes('validation')) {
        setErrors({ general: err.message })
      } else {
        setError('Greška pri čuvanju: ' + err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/manage-leagues')
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            Učitavanje...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
          <span 
            onClick={() => navigate('/manage-leagues')} 
            style={{ cursor: 'pointer', color: '#007bff' }}
          >
            Upravljanje ligama
          </span>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{isEdit ? 'Edituj ligu' : 'Kreiraj novu ligu'}</span>
        </nav>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{ 
                float: 'right', 
                background: 'none', 
                border: 'none', 
                color: 'inherit',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            {success}
          </div>
        )}

        <div className="page-header" style={{ marginBottom: '32px' }}>
          <h1 className="page-title">
            🏆 {isEdit ? 'Edituj ligu' : 'Kreiraj novu ligu'}
          </h1>
        </div>

        <div className="card" style={{ maxWidth: '800px' }}>
          <div className="card-header">
            <h2 className="card-title">
              {isEdit ? 'Izmeni podatke o ligi' : 'Osnovne informacije o ligi'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            {errors.general && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {errors.general}
              </div>
            )}

            {/* Organization Selection (Super Admin only) */}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                  Organizacija *
                </label>
                <select
                  value={formData.organization_id}
                  onChange={e => setFormData(prev => ({ ...prev, organization_id: parseInt(e.target.value) }))}
                  className={`form-control ${errors.organization_id ? 'is-invalid' : ''}`}
                  required
                >
                  <option value="">Izaberite organizaciju...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                {errors.organization_id && <div className="invalid-feedback">{errors.organization_id}</div>}
              </div>
            )}

            {/* League Name */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                Naziv lige *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                required
                placeholder="Unesite naziv lige..."
                style={{ fontSize: '16px', padding: '12px 16px' }}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            {/* Season and Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                  Sezona *
                </label>
                <select
                  value={formData.season}
                  onChange={e => setFormData(prev => ({ ...prev, season: e.target.value }))}
                  className={`form-control ${errors.season ? 'is-invalid' : ''}`}
                  required
                  style={{ fontSize: '16px', padding: '12px 16px' }}
                >
                  {seasons.map(season => (
                    <option key={season} value={season}>
                      {season === 'Prolece' ? '🌸 Prolece' :
                       season === 'Leto' ? '☀️ Leto' :
                       season === 'Jesen' ? '🍂 Jesen' : '❄️ Zima'}
                    </option>
                  ))}
                </select>
                {errors.season && <div className="invalid-feedback">{errors.season}</div>}
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                  Godina *
                </label>
                <select
                  value={formData.year}
                  onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className={`form-control ${errors.year ? 'is-invalid' : ''}`}
                  required
                  style={{ fontSize: '16px', padding: '12px 16px' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.year && <div className="invalid-feedback">{errors.year}</div>}
              </div>
            </div>

            {/* Total Rounds */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                Broj kola *
              </label>
              <input
                type="number"
                value={formData.total_rounds}
                onChange={e => setFormData(prev => ({ ...prev, total_rounds: parseInt(e.target.value) || 1 }))}
                className={`form-control ${errors.total_rounds ? 'is-invalid' : ''}`}
                min="1"
                max="50"
                required
                style={{ fontSize: '16px', padding: '12px 16px' }}
              />
              <small style={{ color: 'rgba(228, 230, 234, 0.6)', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                Broj kola koje će biti odigrano u ligi (1-50)
              </small>
              {errors.total_rounds && <div className="invalid-feedback">{errors.total_rounds}</div>}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontWeight: '500' }}>
                Opis lige
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                rows="4"
                placeholder="Unesite opis lige, pravila, napomene... (opciono)"
                style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}
              />
              {errors.description && <div className="invalid-feedback">{errors.description}</div>}
            </div>

            {/* Active Status (Edit mode only) */}
            {isEdit && (
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="checkbox-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#e4e6ea',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                  />
                  Liga je aktivna
                </label>
                <small style={{ color: 'rgba(228, 230, 234, 0.6)', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                  Neaktivne lige se neće prikazivati u javnim listama
                </small>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              paddingTop: '24px', 
              borderTop: '1px solid rgba(228, 230, 234, 0.1)',
              justifyContent: 'flex-end'
            }}>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-secondary"
                style={{ minWidth: '120px', padding: '12px 24px' }}
              >
                Otkaži
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary"
                style={{ minWidth: '120px', padding: '12px 24px' }}
              >
                {saving ? 'Čuvanje...' : (isEdit ? 'Sačuvaj izmene' : 'Kreiraj ligu')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LeagueForm