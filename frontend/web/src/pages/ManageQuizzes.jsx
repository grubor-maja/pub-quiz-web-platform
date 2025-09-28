import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService } from '../services/teamService'

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data || [])
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const getCapacityColor = (registeredCount, capacity) => {
    if (!capacity) return '#214a9c'
    const percentage = (registeredCount / capacity) * 100
    if (percentage >= 90) return '#dc3545'
    if (percentage >= 70) return '#f39c12'
    return '#28a745'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isUpcoming = (dateStr) => {
    return new Date(dateStr) >= new Date()
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            Loading quizzes...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Manage Quizzes</h1>
          <button className="btn btn-primary">
            + Add New Quiz
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Quizzes ({quizzes.length})</h2>
          </div>
          
          {quizzes.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3>No quizzes found</h3>
              <p>Start by creating your first quiz event.</p>
            </div>
          ) : (
            <div className="quiz-grid">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="quiz-card">
                  <img 
                    src={quiz.image_url || 'https://via.placeholder.com/380x220/1a1f29/214a9c?text=Quiz+Event'} 
                    alt={quiz.title}
                    className="quiz-card-image"
                  />
                  <div className="quiz-card-content">
                    <h3 className="quiz-card-title">{quiz.title}</h3>
                    <p className="quiz-card-description">{quiz.description}</p>
                    
                    {/* Quiz Info */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '12px',
                      padding: '8px 0',
                      borderTop: '1px solid rgba(228, 230, 234, 0.1)',
                      fontSize: '13px',
                      color: 'rgba(228, 230, 234, 0.7)'
                    }}>
                      <div>📅 {formatDate(quiz.date)}</div>
                      <div style={{
                        color: isUpcoming(quiz.date) ? '#28a745' : '#dc3545',
                        fontWeight: '500'
                      }}>
                        {isUpcoming(quiz.date) ? '🟢 Upcoming' : '🔴 Past'}
                      </div>
                    </div>

                    {/* Capacity Info */}
                    {quiz.capacity && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                          fontSize: '13px',
                          color: 'rgba(228, 230, 234, 0.8)'
                        }}>
                          <span>Teams: {quiz.registered_teams_count || 0}/{quiz.capacity}</span>
                          <span style={{ color: getCapacityColor(quiz.registered_teams_count || 0, quiz.capacity) }}>
                            {quiz.remaining_capacity || (quiz.capacity - (quiz.registered_teams_count || 0))} left
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(228, 230, 234, 0.2)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${((quiz.registered_teams_count || 0) / quiz.capacity) * 100}%`,
                            height: '100%',
                            background: getCapacityColor(quiz.registered_teams_count || 0, quiz.capacity),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}

                    {!quiz.capacity && (
                      <div style={{
                        marginTop: '12px',
                        padding: '6px 8px',
                        background: 'rgba(248, 249, 250, 0.05)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'rgba(228, 230, 234, 0.6)',
                        textAlign: 'center'
                      }}>
                        No capacity limit set
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        className="btn btn-sm btn-primary"
                      >
                        👥 Manage Teams
                      </button>
                      <button className="btn btn-sm btn-secondary">
                        ✏️ Edit
                      </button>
                      <button className="btn btn-sm" style={{ 
                        background: 'rgba(220, 53, 69, 0.15)',
                        color: '#dc3545',
                        border: '1px solid rgba(220, 53, 69, 0.3)'
                      }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageQuizzes