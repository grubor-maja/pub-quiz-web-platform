import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AddQuiz() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '20:00',
    min_team_size: 1,
    max_team_size: 4,
    capacity: '',
    fee: '',
    contact_phone: '',
    image_url: ''
  })
  const [userOrganizations, setUserOrganizations] = useState([])
  const [selectedOrganization, setSelectedOrganization] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserOrganizations = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/api/users/me/organizations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUserOrganizations(data || [])

          // Auto-select organization if user has only one
          if (data && data.length === 1) {
            setSelectedOrganization(data[0].organization_id)
          }
        }
      } catch (err) {
        console.error('Error loading user organizations:', err)
      }
    }

    fetchUserOrganizations()
  }, [])

  const fetchMemberRole = async (organizationId, token) => {
  const response = await fetch(`http://localhost:8000/api/organizations/${organizationId}/members`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Ne mogu da dohvatim members listu');
  }

  const members = await response.json();

  const member = members.find(m => m.user_id === user.id);
  return member ? member.role : null;
};

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!selectedOrganization) {
      setError('Morate izabrati organizaciju')
      setSaving(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      console.log('Current user:', user);
      const memberRole = await fetchMemberRole(selectedOrganization, token);
      user.role = memberRole;
      const quizData = {
        ...formData,
        organization_id: parseInt(selectedOrganization),
        user: user
      }

  console.log('Submitting quiz data:', quizData)
      
      const response = await fetch('http://localhost:8000/api/quizzes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(quizData),
      })

      if (response.ok) {
        setSuccess('Kviz je uspešno kreiran!')
        setTimeout(() => {
          navigate('/manage/quizzes')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.log('DUSANE:', errorData)
        setError(errorData.message || 'Neuspešno kreiranje kviza')
      }
    } catch (err) {
      setError('Greška mreže: ' + err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'image_url') {
      setImagePreviewError(false)
    }
  }

  const handleImageError = () => {
    setImagePreviewError(true)
  }

  const handleImageLoad = () => {
    setImagePreviewError(false)
  }

  // Set custom validation messages in Serbian
  useEffect(() => {
    const setCustomValidityMessages = () => {
      const inputs = document.querySelectorAll('input[required], select[required], textarea[required]')
      inputs.forEach(input => {
        input.addEventListener('invalid', (e) => {
          e.preventDefault()
          if (input.validity.valueMissing) {
            input.setCustomValidity('Ovo polje je obavezno')
          } else if (input.validity.typeMismatch) {
            input.setCustomValidity('Molimo unesite ispravnu vrednost')
          } else if (input.validity.tooShort) {
            input.setCustomValidity('Unos je prekratak')
          } else if (input.validity.tooLong) {
            input.setCustomValidity('Unos je predugačak')
          }
        })

        input.addEventListener('input', () => {
          input.setCustomValidity('')
        })
      })
    }

    setCustomValidityMessages()
  }, [])

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Kreiraj novi kviz</h1>
          <button 
            onClick={() => navigate('/manage/quizzes')}
            className="btn btn-secondary"
          >
            ← Nazad na kvizove
          </button>
        </div>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Informacije o novom kvizu</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            {/* Organization Selection - show for all users */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">
                Organizacija * {userOrganizations.length > 1 && (
                  <small style={{ fontWeight: 'normal', color: 'rgba(228, 230, 234, 0.6)' }}>
                    (Član ste {userOrganizations.length} organizacija)
                  </small>
                )}
              </label>
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                required
                className="form-control"
              >
                <option value="">Izaberite organizaciju...</option>
                {userOrganizations.map(org => (
                  <option key={org.organization_id} value={org.organization_id}>
                    {org.organization_name} ({org.role === 'ADMIN' ? 'Administrator' : 'Član'})
                  </option>
                ))}
              </select>
              {userOrganizations.length === 0 && (
                <small style={{ color: 'rgba(220, 53, 69, 0.8)', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                  Niste član nijedne organizacije. Kontaktirajte administratora.
                </small>
              )}
            </div>

            {/* Quiz Name and Venue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Naziv kviza *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Unesite naziv kviza"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lokal *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Unesite naziv lokala"
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Opis</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Opis kviza - tema, format, nagrada..."
              />
            </div>

            {/* Image URL */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">URL slike kviza</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="form-control"
                placeholder="https://example.com/slika-kviza.jpg"
              />
              <small style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '13px' }}>
                Opciono - dodajte URL slike koja će se prikazati na kartici kviza
              </small>
              
              {/* Image Preview */}
              {formData.image_url && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(228, 230, 234, 0.05)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'rgba(228, 230, 234, 0.8)' }}>
                    Pregled kako će izgledati na dashboard-u:
                  </h4>
                  
                  {!imagePreviewError ? (
                    <div className="quiz-card" style={{ maxWidth: '300px', margin: '0' }}>
                      <img 
                        src={formData.image_url} 
                        alt="Preview kviza"
                        className="quiz-card-image"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                      />
                      <div style={{ padding: '16px', background: 'rgba(228, 230, 234, 0.08)', borderRadius: '0 0 8px 8px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#e4e6ea' }}>
                          {formData.title || 'Naziv kviza'}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', color: 'rgba(228, 230, 234, 0.7)' }}>
                          {formData.description || 'Opis kviza...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '20px', 
                      background: 'rgba(220, 53, 69, 0.1)', 
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                      <p style={{ color: '#dc3545', margin: 0, fontSize: '13px' }}>
                        Slika se ne može učitati. Proverite URL adresu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Datum *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vreme *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select
                    name="hour"
                    value={formData.time ? formData.time.split(':')[0] : '20'}
                    onChange={(e) => {
                      const hour = e.target.value
                      const minute = formData.time ? formData.time.split(':')[1] : '00'
                      setFormData(prev => ({ ...prev, time: `${hour}:${minute}` }))
                    }}
                    required
                    className="form-control"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return <option key={hour} value={hour}>{hour}</option>
                    })}
                  </select>
                  <select
                    name="minute"
                    value={formData.time ? formData.time.split(':')[1] : '00'}
                    onChange={(e) => {
                      const hour = formData.time ? formData.time.split(':')[0] : '20'
                      const minute = e.target.value
                      setFormData(prev => ({ ...prev, time: `${hour}:${minute}` }))
                    }}
                    required
                    className="form-control"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const minute = (i * 5).toString().padStart(2, '0')
                      return <option key={minute} value={minute}>{minute}</option>
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Team Size and Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Min broj članova</label>
                <input
                  type="number"
                  name="min_team_size"
                  value={formData.min_team_size}
                  onChange={handleChange}
                  min="1"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maks broj članova</label>
                <input
                  type="number"
                  name="max_team_size"
                  value={formData.max_team_size}
                  onChange={handleChange}
                  min="1"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kapacitet</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className="form-control"
                  placeholder="Broj timova"
                />
              </div>
            </div>

            {/* Fee and Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Kotizacija (RSD)</label>
                <input
                  type="number"
                  name="fee"
                  value={formData.fee}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="form-control"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kontakt telefon</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="+381..."
                />
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0 }}> {error}</p>
              </div>
            )}

            {success && (
              <div className="card" style={{
                background: 'rgba(40, 167, 69, 0.1)',
                borderColor: 'rgba(40, 167, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#28a745', margin: 0 }}> {success}</p>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/quizzes')}
                className="btn btn-secondary"
              >
                Otkaži
              </button>
              
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Kreiranje...' : ' Kreiraj kviz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddQuiz

