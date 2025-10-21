import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'

function EditQuiz() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    min_team_size: 1,
    max_team_size: 4,
    capacity: '',
    fee: '',
    contact_phone: '',
    image_url: ''
  })
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/quizzes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const quiz = await response.json()
        setFormData({
          title: quiz.title || '',
          description: quiz.description || '',
          venue: quiz.venue || '',
          date: quiz.date || '',
          time: quiz.time || '',
          min_team_size: quiz.min_team_size || 1,
          max_team_size: quiz.max_team_size || 4,
          capacity: quiz.capacity || '',
          fee: quiz.fee || '',
          contact_phone: quiz.contact_phone || '',
          image_url: quiz.image_url || ''
        })
      } else {
        setError('Failed to fetch quiz')
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
      const response = await fetch(`http://localhost:8000/api/quizzes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Kviz je uspešno ažuriran')
        setTimeout(() => {
          navigate('/manage/quizzes')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update quiz')
      }
    } catch (err) {
      setError('Network error')
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

  useEffect(() => {
    fetchQuiz()
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

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Izmeni kviz</h1>
          <button 
            onClick={() => navigate('/manage/quizzes')}
            className="btn btn-secondary"
          >
            ← Nazad na kvizove
          </button>
        </div>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Informacije o kvizu</h2>
          </div>

          <form onSubmit={handleSubmit}>
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
                  placeholder="Naziv kviza"
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
                  placeholder="Unesite lokal"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Opis</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Opis kviza..."
              />
            </div>

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

            <div className="form-group">
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

            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
              </div>
            )}

            {success && (
              <div className="card" style={{
                background: 'rgba(40, 167, 69, 0.1)',
                borderColor: 'rgba(40, 167, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#28a745', margin: 0 }}>✅ {success}</p>
              </div>
            )}

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
                {saving ? 'Ažuriranje...' : 'Ažuriraj kviz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditQuiz