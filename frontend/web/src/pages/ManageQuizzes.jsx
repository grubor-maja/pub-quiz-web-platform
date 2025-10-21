import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { quizService, teamService } from '../services/teamService'
import LoadingDragon from '../components/LoadingDragon'
import { FaRegEdit } from 'react-icons/fa'
import { RiDeleteBin6Line, RiTeamFill } from 'react-icons/ri'
import {TbMoodEmpty} from "react-icons/tb";

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingApplications, setPendingApplications] = useState({})
  const [loadingApplications, setLoadingApplications] = useState({})
  const navigate = useNavigate()

    const fetchQuizzes = async () => {
        try {
            // Get user and organization_id (adjust if you use a different storage or context)
            const user = JSON.parse(localStorage.getItem('user'))
            const orgId = user?.organization_id

            console.log('Current user:', user);
            console.log('Organization ID:', orgId);

            if (!orgId) {
                console.warn('No organization_id found for user. User must be assigned to an organization.');
                alert('Morate biti dodeljeni organizaciji da biste upravljali kvizovima. Kontaktirajte administratora.');
                setQuizzes([])
                setPendingApplications({})
                setLoading(false)
                return
            }

            console.log(`Fetching quizzes for organization ${orgId}...`);
            const response = await fetch(`http://localhost:8000/api/orgs/${orgId}/quizzes`)

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json()
                console.log('Fetched quizzes:', data)
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
            } else {
                const errorData = await response.json()
                console.error('Failed to fetch quizzes:', errorData)
                alert(`Greška pri učitavanju kvizova: ${errorData.message || 'Nepoznata greška'}`)
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err)
            alert('Greška pri povezivanju sa serverom: ' + err.message)
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
        alert('Kviz uspešno obrisan!')
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
    return new Date(dateStr).toLocaleDateString('sr-Latn-RS', {
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
          <LoadingDragon />
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Upravljanje kvizovima</h1>
          <Link 
            to="/manage/quizzes/add"
            className="btn btn-primary"
          >
            + Kreiraj kviz
          </Link>
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
            <h2 className="card-title">Svi kvizovi ({quizzes.length})</h2>
          </div>
          
          {quizzes.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><TbMoodEmpty/></div>
              <h3>Nema kvizova</h3>
              <p>Počni sa kreiranjem novog kviza.</p>
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
                        {isUpcoming(quiz.date) ? '🟢 Predstojeći' : '🔴 Prošao'}
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
                          <span>Timovi: {quiz.registered_teams_count || 0}/{quiz.capacity}</span>
                          <span style={{ color: getCapacityColor(quiz.registered_teams_count || 0, quiz.capacity) }}>
                            {quiz.remaining_capacity || (quiz.capacity - (quiz.registered_teams_count || 0))} preostalo
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


                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        className="btn btn-sm btn-primary"
                      >
                        <RiTeamFill style={{ marginRight: '4px' }} /> Upravljanje timovima
                      </button>
                      <button 
                        onClick={() => navigate(`/quiz/${quiz.id}/edit`)}
                        className="btn btn-sm btn-secondary"
                      >
                        <FaRegEdit style={{ marginRight: '4px' }} /> Izmeni
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
                        <RiDeleteBin6Line style={{ marginRight: '4px' }} /> Obriši
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