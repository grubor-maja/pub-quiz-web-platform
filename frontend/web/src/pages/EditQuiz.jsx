import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
    contact_phone: ''
  })
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
          contact_phone: quiz.contact_phone || ''
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
        navigate('/manage/quizzes')
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
  }

  useEffect(() => {
    fetchQuiz()
  }, [id])

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            Loading quiz...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Edit Quiz</h1>
          <button 
            onClick={() => navigate('/manage/quizzes')}
            className="btn btn-secondary"
          >
            ← Back to Quizzes
          </button>
        </div>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">Quiz Information</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Quiz Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Enter quiz title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Enter venue"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Quiz description..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
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
                <label className="form-label">Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Min Team Size</label>
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
                <label className="form-label">Max Team Size</label>
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
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className="form-control"
                  placeholder="Max teams"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Entry Fee (RSD)</label>
                <input
                  type="number"
                  name="fee"
                  value={formData.fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
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

            {error && (
              <div className="card" style={{ 
                background: 'rgba(220, 53, 69, 0.1)', 
                borderColor: 'rgba(220, 53, 69, 0.3)',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => navigate('/manage/quizzes')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Update Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditQuiz