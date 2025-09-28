import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import { quizService, teamService } from '../services/teamService'

function QuizDetails() {
  const [quiz, setQuiz] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [quizTeams, setQuizTeams] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Check if this is view-only mode (from Dashboard)
  const isViewOnly = searchParams.get('mode') === 'view'

  const fetchQuiz = async () => {
    try {
      const data = await quizService.getQuizWithTeams(id)
      setQuiz(data)
      
      // Fetch organization details
      const orgResponse = await fetch(`http://localhost:8000/api/organizations/${data.organization_id}`)
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData)
      }
    } catch (err) {
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizTeams = async () => {
    try {
      const teamsData = await teamService.getQuizTeams(id)
      setQuizTeams(teamsData)
    } catch (err) {
      console.error('Failed to load quiz teams:', err)
    }
  }

  useEffect(() => {
    if (id) {
      fetchQuiz()
      fetchQuizTeams()
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            {quiz.capacity && (
              <span style={{ 
                fontSize: '16px', 
                color: 'rgba(228, 230, 234, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                👥 {quiz.registered_teams_count || 0}/{quiz.capacity} teams
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '32px',
          borderBottom: '1px solid rgba(228, 230, 234, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'details' ? 'rgba(33, 74, 156, 0.15)' : 'transparent',
                color: activeTab === 'details' ? '#214a9c' : 'rgba(228, 230, 234, 0.8)',
                border: 'none',
                borderBottom: activeTab === 'details' ? '2px solid #214a9c' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'details' ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
            >
              📋 Quiz Details
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'teams' ? 'rgba(33, 74, 156, 0.15)' : 'transparent',
                color: activeTab === 'teams' ? '#214a9c' : 'rgba(228, 230, 234, 0.8)',
                border: 'none',
                borderBottom: activeTab === 'teams' ? '2px solid #214a9c' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'teams' ? '600' : '400',
                transition: 'all 0.2s ease',
                display: isViewOnly ? 'none' : 'block'
              }}
            >
              👥 Teams ({quizTeams ? quizTeams.registered_count || 0 : 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
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
                <div style={{ display: 'grid', gridTemplateColumns: quiz.capacity ? '1fr 1fr 1fr' : '1fr 1fr', gap: '20px' }}>
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
                  {quiz.capacity && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                        {quiz.remaining_capacity || (quiz.capacity - (quiz.registered_teams_count || 0))}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                        Spots Left
                      </div>
                    </div>
                  )}
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

                  {quiz.capacity && (
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
                        🏟️
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Venue Capacity</div>
                        <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                          {quiz.capacity} teams maximum
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {isUpcoming() && !isViewOnly ? (
                  <button 
                    onClick={() => setActiveTab('teams')} 
                    className="btn btn-primary btn-lg" 
                    style={{ flex: 1, minWidth: '200px' }}
                  >
                    🎯 Manage Teams
                  </button>
                ) : isUpcoming() && isViewOnly ? (
                  <div className="card" style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    background: 'rgba(33, 74, 156, 0.1)',
                    borderColor: 'rgba(33, 74, 156, 0.3)'
                  }}>
                    <p style={{ margin: 0, color: '#214a9c', fontSize: '14px' }}>
                      ℹ️ To manage teams for this quiz, go to <strong>Manage Quizzes</strong>
                    </p>
                  </div>
                ) : (
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '200px' }} disabled>
                    📝 Quiz Ended
                  </button>
                )}
                
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  🖨️ Print Details
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && !isViewOnly && (
          <TeamsTabContent 
            quiz={quiz} 
            quizTeams={quizTeams} 
            organization={organization}
            onTeamsUpdate={fetchQuizTeams}
          />
        )}

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

// Teams Tab Content Component
function TeamsTabContent({ quiz, quizTeams, organization, onTeamsUpdate }) {
  const [orgTeams, setOrgTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch all teams for this organization
  const fetchOrgTeams = async () => {
    if (!quiz?.organization_id) return
    
    setLoading(true)
    try {
      const teams = await teamService.getTeamsByOrganization(quiz.organization_id)
      setOrgTeams(teams)
    } catch (err) {
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgTeams()
  }, [quiz?.organization_id])

  const handleApplyTeam = async (teamId) => {
    try {
      await teamService.applyTeamForQuiz(teamId, quiz.id)
      setSuccess('Team application submitted successfully!')
      onTeamsUpdate() // Refresh quiz teams data
      fetchOrgTeams() // Refresh org teams to update registration status
    } catch (err) {
      setError(err.message || 'Failed to submit team application')
    }
  }

  const handleUnregisterTeam = async (teamId) => {
    try {
      await teamService.unregisterTeamFromQuiz(teamId, quiz.id)
      setSuccess('Team unregistered successfully!')
      onTeamsUpdate() // Refresh quiz teams data
      fetchOrgTeams() // Refresh org teams
    } catch (err) {
      setError(err.message || 'Failed to unregister team')
    }
  }

  const getCapacityColor = () => {
    if (!quiz.capacity) return '#214a9c'
    const percentage = ((quiz.registered_teams_count || 0) / quiz.capacity) * 100
    if (percentage >= 90) return '#dc3545'
    if (percentage >= 70) return '#f39c12'
    return '#28a745'
  }

  const getAppliedTeamIds = () => {
    return quizTeams?.teams?.filter(team => team.pivot.status === 'pending').map(team => team.id) || []
  }

  const getRegisteredTeamIds = () => {
    return quizTeams?.teams?.filter(team => team.pivot.status === 'registered').map(team => team.id) || []
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Success/Error Messages */}
      {success && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '24px', 
          background: 'rgba(40, 167, 69, 0.1)', 
          border: '1px solid rgba(40, 167, 69, 0.3)', 
          borderRadius: '8px',
          color: '#28a745'
        }}>
          ✅ {success}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '24px', 
          background: 'rgba(220, 53, 69, 0.1)', 
          border: '1px solid rgba(220, 53, 69, 0.3)', 
          borderRadius: '8px',
          color: '#dc3545'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
        {/* Left Side - Registered Teams */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="card-title">Registered Teams</h3>
              {quiz.capacity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: 'rgba(228, 230, 234, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${((quiz.registered_teams_count || 0) / quiz.capacity) * 100}%`,
                      height: '100%',
                      background: getCapacityColor(),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.8)' }}>
                    {quiz.registered_teams_count || 0}/{quiz.capacity}
                  </span>
                </div>
              )}
            </div>

            {quizTeams?.teams?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quizTeams.teams
                  .filter(team => team.pivot.status === 'registered')
                  .map((team, index) => (
                  <div key={team.id} style={{
                    padding: '16px',
                    background: 'rgba(33, 74, 156, 0.05)',
                    border: '1px solid rgba(33, 74, 156, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#e4e6ea' }}>
                          #{index + 1} {team.name}
                        </h4>
                        <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                          👥 {team.member_count} members
                        </div>
                        {team.contact_phone && (
                          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            📞 {team.contact_phone}
                          </div>
                        )}
                        {team.contact_email && (
                          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            ✉️ {team.contact_email}
                          </div>
                        )}
                        {team.pivot.final_position && (
                          <div style={{ 
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: '#f39c12',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'inline-block'
                          }}>
                            🏆 {team.pivot.final_position === 1 ? '1st Place' : 
                                team.pivot.final_position === 2 ? '2nd Place' : '3rd Place'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnregisterTeam(team.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid rgba(220, 53, 69, 0.3)',
                          borderRadius: '4px',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(228, 230, 234, 0.6)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <p>No teams registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Available Teams */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="card-title">Organization Teams</h3>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="btn btn-primary btn-sm"
              >
                + Add New Team
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                Loading teams...
              </div>
            ) : orgTeams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orgTeams.map(team => {
                  const isRegistered = getRegisteredTeamIds().includes(team.id)
                  const isApplied = getAppliedTeamIds().includes(team.id)
                  const canApply = !isRegistered && !isApplied && (!quiz.capacity || (quiz.registered_teams_count || 0) < quiz.capacity)
                  
                  return (
                    <div key={team.id} style={{
                      padding: '16px',
                      background: isRegistered ? 'rgba(40, 167, 69, 0.05)' : 
                                  isApplied ? 'rgba(255, 193, 7, 0.05)' : 
                                  'rgba(228, 230, 234, 0.05)',
                      border: `1px solid ${isRegistered ? 'rgba(40, 167, 69, 0.2)' : 
                                           isApplied ? 'rgba(255, 193, 7, 0.2)' : 
                                           'rgba(228, 230, 234, 0.2)'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#e4e6ea' }}>
                            {team.name} {isRegistered && '✅'} {isApplied && '⏳'}
                          </h4>
                          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            👥 {team.member_count} members
                          </div>
                          {team.contact_phone && (
                            <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                              📞 {team.contact_phone}
                            </div>
                          )}
                        </div>
                        {canApply && (
                          <button
                            onClick={() => handleApplyTeam(team.id)}
                            className="btn btn-primary btn-sm"
                          >
                            Apply
                          </button>
                        )}
                        {isApplied && (
                          <span style={{ 
                            padding: '4px 8px',
                            background: 'rgba(255, 193, 7, 0.2)',
                            color: '#ffc107',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Pending
                          </span>
                        )}
                        {isRegistered && (
                          <span style={{ 
                            padding: '4px 8px',
                            background: 'rgba(40, 167, 69, 0.2)',
                            color: '#28a745',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Registered
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(228, 230, 234, 0.6)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <p>No teams created yet</p>
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Create First Team
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <AddTeamModal
          quiz={quiz}
          organization={organization}
          onClose={() => {
            setShowAddTeamModal(false)
            setError('')
            setSuccess('')
          }}
          onTeamAdded={(newTeam) => {
            setShowAddTeamModal(false)
            fetchOrgTeams()
            setSuccess('Team created successfully!')
          }}
        />
      )}
    </div>
  )
}

// Add Team Modal Component
function AddTeamModal({ quiz, organization, onClose, onTeamAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    member_count: '',
    contact_phone: '',
    contact_email: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const teamData = {
        ...formData,
        organization_id: quiz.organization_id,
        member_count: parseInt(formData.member_count)
      }

      const newTeam = await teamService.createTeam(teamData)
      onTeamAdded(newTeam)
    } catch (err) {
      if (err.message.includes('validation')) {
        // Handle validation errors
        setErrors({ general: err.message })
      } else {
        setErrors({ general: err.message || 'Failed to create team' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1f29',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 24px 0', color: '#e4e6ea' }}>Add New Team</h3>
        
        {errors.general && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '6px',
            color: '#dc3545',
            fontSize: '14px'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'rgba(228, 230, 234, 0.9)', fontSize: '14px' }}>
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: `1px solid ${errors.name ? '#dc3545' : 'rgba(228, 230, 234, 0.2)'}`,
                borderRadius: '6px',
                color: '#e4e6ea',
                fontSize: '14px'
              }}
              required
            />
            {errors.name && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'rgba(228, 230, 234, 0.9)', fontSize: '14px' }}>
              Number of Members *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.member_count}
              onChange={(e) => handleInputChange('member_count', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: `1px solid ${errors.member_count ? '#dc3545' : 'rgba(228, 230, 234, 0.2)'}`,
                borderRadius: '6px',
                color: '#e4e6ea',
                fontSize: '14px'
              }}
              required
            />
            {errors.member_count && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.member_count}</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'rgba(228, 230, 234, 0.9)', fontSize: '14px' }}>
              Contact Phone
            </label>
            <input
              type="text"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: `1px solid ${errors.contact_phone ? '#dc3545' : 'rgba(228, 230, 234, 0.2)'}`,
                borderRadius: '6px',
                color: '#e4e6ea',
                fontSize: '14px'
              }}
            />
            {errors.contact_phone && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.contact_phone}</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'rgba(228, 230, 234, 0.9)', fontSize: '14px' }}>
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: `1px solid ${errors.contact_email ? '#dc3545' : 'rgba(228, 230, 234, 0.2)'}`,
                borderRadius: '6px',
                color: '#e4e6ea',
                fontSize: '14px'
              }}
            />
            {errors.contact_email && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.contact_email}</div>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'rgba(228, 230, 234, 0.9)', fontSize: '14px' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: `1px solid ${errors.notes ? '#dc3545' : 'rgba(228, 230, 234, 0.2)'}`,
                borderRadius: '6px',
                color: '#e4e6ea',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            {errors.notes && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.notes}</div>}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(228, 230, 234, 0.1)',
                border: '1px solid rgba(228, 230, 234, 0.2)',
                borderRadius: '6px',
                color: 'rgba(228, 230, 234, 0.8)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#666' : '#214a9c',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuizDetails