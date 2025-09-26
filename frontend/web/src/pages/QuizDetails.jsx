import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'

function QuizDetails() {
  const [quiz, setQuiz] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/quizzes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data)
        
        // Fetch organization details
        const orgResponse = await fetch(`http://localhost:8000/api/organizations/${data.organization_id}`)
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          setOrganization(orgData)
        }
      } else {
        setError('Quiz not found')
      }
    } catch (err) {
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchQuiz()
    }
  }, [id])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeStr) => {
    return timeStr.slice(0, 5) // Remove seconds
  }

  const isUpcoming = () => {
    return new Date(`${quiz.date} ${quiz.time}`) > new Date()
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <LoadingDragon />
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>Quiz not found</h3>
            <p>The quiz you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        {/* Back Button */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            ← Back to Quizzes
          </button>
        </div>

        {/* Quiz Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800',
            color: '#214a9c',
            marginBottom: '16px',
            lineHeight: '1.1'
          }}>
            {quiz.title}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '16px', 
              color: isUpcoming() ? '#28a745' : '#dc3545',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isUpcoming() ? '🟢 Upcoming Event' : '🔴 Past Event'}
            </span>
            {organization && (
              <span style={{ 
                fontSize: '16px', 
                color: 'rgba(228, 230, 234, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏢 {organization.name}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '48px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Left Side - Image */}
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <img 
                src={quiz.image_url || 'https://via.placeholder.com/600x400/1a1f29/214a9c?text=Quiz+Event'} 
                alt={quiz.title}
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400/1a1f29/214a9c?text=Quiz+Event'
                }}
              />
            </div>

            {/* Quick Stats */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h3 className="card-title" style={{ marginBottom: '24px' }}>Quick Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                    {quiz.fee ? `${quiz.fee}` : '0'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                    {quiz.fee ? 'RSD Entry Fee' : 'Free Entry'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                    {quiz.min_team_size}-{quiz.max_team_size}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                    Team Members
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Information */}
          <div>
            {/* Description */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>About This Quiz</h3>
              <p style={{ 
                fontSize: '16px', 
                lineHeight: '1.6', 
                color: 'rgba(228, 230, 234, 0.9)',
                margin: 0
              }}>
                {quiz.description}
              </p>
            </div>

            {/* Event Details */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '24px' }}>Event Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'rgba(33, 74, 156, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    📅
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Date & Time</div>
                    <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                      {formatDate(quiz.date)} at {formatTime(quiz.time)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'rgba(33, 74, 156, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    📍
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Location</div>
                    <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                      {quiz.venue}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'rgba(33, 74, 156, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    👥
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Team Size</div>
                    <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                      {quiz.min_team_size === quiz.max_team_size 
                        ? `Exactly ${quiz.min_team_size} members`
                        : `${quiz.min_team_size} - ${quiz.max_team_size} members`
                      }
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'rgba(33, 74, 156, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    💰
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Entry Fee</div>
                    <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                      {quiz.fee ? `${quiz.fee} RSD per team` : 'Free participation'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {isUpcoming() ? (
                <button className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '200px' }}>
                  🎯 Register for Quiz
                </button>
              ) : (
                <button className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '200px' }} disabled>
                  📝 Registration Closed
                </button>
              )}
              
              <button className="btn btn-secondary" onClick={() => window.print()}>
                🖨️ Print Details
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <style>{`
          @media (max-width: 768px) {
            .main-content .container-fluid > div:nth-child(3) {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default QuizDetails