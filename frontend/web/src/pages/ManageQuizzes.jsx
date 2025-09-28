import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, teamService } from '../services/teamService'

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingApplications, setPendingApplications] = useState({})
  const [loadingApplications, setLoadingApplications] = useState({})
  const navigate = useNavigate()

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data || [])
        
        // Fetch pending applications for each quiz
        const applications = {}
        for (const quiz of data || []) {
          try {
            const teamsResponse = await teamService.getQuizTeams(quiz.id)
            const pendingTeams = teamsResponse.teams?.filter(team => team.pivot.status === 'pending') || []
            if (pendingTeams.length > 0) {
              applications[quiz.id] = pendingTeams
            }
          } catch (err) {
            console.error(`Error fetching teams for quiz ${quiz.id}:`, err)
          }
        }
        setPendingApplications(applications)
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all team registrations.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
        alert('Quiz deleted successfully!')
      } else {
        const errorData = await response.json()
        console.error('Delete quiz error:', errorData)
        alert(`Failed to delete quiz: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Delete quiz network error:', err)
      alert('Network error: ' + err.message)
    }
  }

  const handleApproveTeam = async (quizId, teamId) => {
    setLoadingApplications(prev => ({...prev, [teamId]: true}))
    try {
      await teamService.approveTeamApplication(teamId, quizId)
      await fetchQuizzes() // Refresh data
      alert('Team application approved successfully!')
    } catch (err) {
      console.error('Error approving team:', err)
      alert('Failed to approve team application: ' + err.message)
    } finally {
      setLoadingApplications(prev => ({...prev, [teamId]: false}))
    }
  }

  const handleRejectTeam = async (quizId, teamId) => {
    if (!confirm('Are you sure you want to reject this team application?')) {
      return
    }
    
    setLoadingApplications(prev => ({...prev, [teamId]: true}))
    try {
      await teamService.rejectTeamApplication(teamId, quizId)
      await fetchQuizzes() // Refresh data
      alert('Team application rejected successfully!')
    } catch (err) {
      console.error('Error rejecting team:', err)
      alert('Failed to reject team application: ' + err.message)
    } finally {
      setLoadingApplications(prev => ({...prev, [teamId]: false}))
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

        {/* Pending Applications Section */}
        {Object.keys(pendingApplications).length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h2 className="card-title">⏳ Pending Team Applications</h2>
              <p style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)', margin: '8px 0 0 0' }}>
                Teams waiting for approval to participate in quizzes
              </p>
            </div>
            <div className="card-body">
              {Object.entries(pendingApplications).map(([quizId, teams]) => {
                const quiz = quizzes.find(q => q.id.toString() === quizId)
                return (
                  <div key={quizId} style={{ 
                    marginBottom: '24px', 
                    padding: '16px',
                    background: 'rgba(255, 193, 7, 0.05)',
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#e4e6ea' }}>
                      📊 {quiz?.title || 'Quiz ' + quizId}
                    </h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {teams.map(team => (
                        <div key={team.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'rgba(228, 230, 234, 0.05)',
                          borderRadius: '6px'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#e4e6ea' }}>
                              {team.name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(228, 230, 234, 0.7)' }}>
                              👥 {team.member_count} members
                              {team.contact_phone && ` • 📞 ${team.contact_phone}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveTeam(quizId, team.id)}
                              disabled={loadingApplications[team.id]}
                              className="btn btn-sm btn-primary"
                              style={{ minWidth: '80px' }}
                            >
                              {loadingApplications[team.id] ? '⏳' : '✅ Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectTeam(quizId, team.id)}
                              disabled={loadingApplications[team.id]}
                              className="btn btn-sm"
                              style={{
                                minWidth: '80px',
                                background: 'rgba(220, 53, 69, 0.15)',
                                color: '#dc3545',
                                border: '1px solid rgba(220, 53, 69, 0.3)'
                              }}
                            >
                              {loadingApplications[team.id] ? '⏳' : '❌ Reject'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                      <button 
                        onClick={() => navigate(`/quiz/${quiz.id}/edit`)}
                        className="btn btn-sm btn-secondary"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(quiz.id)}
                        className="btn btn-sm" 
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                      >
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