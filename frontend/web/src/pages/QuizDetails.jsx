import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import { quizService, teamService } from '../services/teamService'
import { RiTeamFill } from 'react-icons/ri'
import {HiDocument, HiInformationCircle} from 'react-icons/hi'
import {BiBuilding, BiCurrentLocation, BiGroup, BiMoney} from "react-icons/bi";
import {PiCalendar, PiMapPinThin} from "react-icons/pi";
import {IoBuild} from "react-icons/io5";
import {FaBuilding} from "react-icons/fa";

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
    return new Date(dateStr).toLocaleDateString('sr-Latn-RS', {
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>x</div>
            <h3>Quiz not found</h3>
            <p>The quiz you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Nazad
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
            ← Nazad na kvizove
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

            {organization && (
              <span style={{ 
                fontSize: '16px', 
                color: 'rgba(228, 230, 234, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BiBuilding/> {organization.name}
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
                👥 {quiz.registered_teams_count || 0}/{quiz.capacity} timova
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
              <HiInformationCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Detalji o kvizu
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
              <RiTeamFill style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Timovi ({quizTeams ? quizTeams.registered_count || 0 : 0})
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
                <h3 className="card-title" style={{ marginBottom: '24px' }}>Statistika</h3>
                <div style={{ display: 'grid', gridTemplateColumns: quiz.capacity ? '1fr 1fr 1fr' : '1fr 1fr', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                      {quiz.fee ? `${quiz.fee}` : '0'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                      {quiz.fee ? 'RSD Kotizacija' : 'Besplatno'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                      {quiz.min_team_size}-{quiz.max_team_size}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                      Veličina tima
                    </div>
                  </div>
                  {quiz.capacity && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', color: '#214a9c', fontWeight: '700' }}>
                        {quiz.remaining_capacity || (quiz.capacity - (quiz.registered_teams_count || 0))}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(228, 230, 234, 0.7)', textTransform: 'uppercase' }}>
                        Broj preostalih mesta
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
                <h3 className="card-title" style={{ marginBottom: '16px' }}>O kvizu</h3>
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
                <h3 className="card-title" style={{ marginBottom: '24px' }}>Detalji događaja</h3>
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
                      <PiCalendar/>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Datum i vreme</div>
                      <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                        {formatDate(quiz.date)} u {formatTime(quiz.time)}
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
                      <PiMapPinThin/>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Lokacija</div>
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
                      <BiGroup/>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Veličina tima</div>
                      <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                        {quiz.min_team_size === quiz.max_team_size 
                          ? `Tačno ${quiz.min_team_size} članova`
                          : `${quiz.min_team_size} - ${quiz.max_team_size} članova`
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
                      <BiMoney/>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Kotizacija</div>
                      <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                        {quiz.fee ? `${quiz.fee} RSD po timu` : 'Besplatno učešće'}
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
                        <FaBuilding/>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#e4e6ea' }}>Kapacitet lokala</div>
                        <div style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px' }}>
                          {quiz.capacity} timova maksimum
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

                
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
  const [processingTeam, setProcessingTeam] = useState(null)

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
    setProcessingTeam(teamId)
    try {
      await teamService.applyTeamForQuiz(teamId, quiz.id)
      setSuccess('Prijava tima je uspešno poslata!')
      onTeamsUpdate()
      fetchOrgTeams()
    } catch (err) {
      setError(err.message || 'Nije uspelo slanje prijave tima')
    } finally {
      setProcessingTeam(null)
    }
  }

  const handleApproveTeam = async (teamId) => {
    setProcessingTeam(teamId)
    try {
      await teamService.approveTeamApplication(teamId, quiz.id)
      setSuccess('Tim je uspešno potvrdjen!')
      onTeamsUpdate()
      fetchOrgTeams()
    } catch (err) {
      setError(err.message || 'Nije uspelo potvrđivanje tima')
    } finally {
      setProcessingTeam(null)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj tim iz baze podataka? Ova akcija je nepovratna.')) {
      return
    }
    
    setProcessingTeam(teamId)
    try {
      // Delete team from database (not just the registration)
      await teamService.deleteTeam(teamId)
      setSuccess('Tim je uspešno obrisan iz baze podataka!')
      onTeamsUpdate()
      fetchOrgTeams()
    } catch (err) {
      setError(err.message || 'Nije uspelo brisanje tima')
    } finally {
      setProcessingTeam(null)
    }
  }

  const handleRejectApplication = async (teamId) => {
    if (!confirm('Da li ste sigurni da želite da obrišete prijavu ovog tima za kviz?')) {
      return
    }
    
    setProcessingTeam(teamId)
    try {
      await teamService.rejectTeamApplication(teamId, quiz.id)
      setSuccess('Prijava tima je uspešno obrisana!')
      onTeamsUpdate()
      fetchOrgTeams()
    } catch (err) {
      setError(err.message || 'Nije uspelo brisanje prijave')
    } finally {
      setProcessingTeam(null)
    }
  }

  const handleCancelRegistration = async (teamId) => {
    if (!confirm('Da li ste sigurni da želite da otkažete registraciju ovog tima?')) {
      return
    }
    
    setProcessingTeam(teamId)
    try {
      await teamService.unregisterTeamFromQuiz(teamId, quiz.id)
      setSuccess('Registracija tima je uspešno otkazana!')
      onTeamsUpdate()
      fetchOrgTeams()
    } catch (err) {
      setError(err.message || 'Nije uspelo otkazivanje registracije')
    } finally {
      setProcessingTeam(null)
    }
  }

  const getCapacityColor = () => {
    if (!quiz.capacity) return '#214a9c'
    const percentage = ((quiz.registered_teams_count || 0) / quiz.capacity) * 100
    if (percentage >= 90) return '#dc3545'
    if (percentage >= 70) return '#f39c12'
    return '#28a745'
  }

  const getPendingTeams = () => {
    return quizTeams?.teams?.filter(team => team.pivot.status === 'pending') || []
  }

  const getRegisteredTeams = () => {
    return quizTeams?.teams?.filter(team => team.pivot.status === 'registered') || []
  }

  const getTeamStatus = (teamId) => {
    const quizTeam = quizTeams?.teams?.find(t => t.id === teamId)
    if (!quizTeam) return null
    return quizTeam.pivot.status
  }

  // Filter out registered teams from organization teams list
  const getAvailableOrgTeams = () => {
    if (!quizTeams?.teams || !orgTeams) return []

    const registeredTeamIds = getRegisteredTeams().map(t => t.id)

    // Filter out teams that are already registered (have status 'registered')
    return orgTeams.filter(team => {
      const isRegistered = registeredTeamIds.includes(team.id)
      return !isRegistered // Only show teams that are NOT registered
    })
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
           {success}
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
        {/* Left Side - Registered Teams (Potvđeni) */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="card-title">Registrovani timovi</h3>
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
                    {getRegisteredTeams().length}/{quiz.capacity}
                  </span>
                </div>
              )}
            </div>

            {getRegisteredTeams().length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getRegisteredTeams().map((team) => (
                  <div key={team.id} style={{
                    padding: '16px',
                    background: 'rgba(40, 167, 69, 0.05)',
                    border: '1px solid rgba(40, 167, 69, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#e4e6ea' }}>
                          {team.name}
                        </h4>
                        <div style={{ fontSize: '13px', marginBottom: '4px', fontWeight: '500', color: '#28a745' }}>
                          Status: Potvrđen dolazak
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                          👥 {team.member_count} članova
                        </div>
                        {team.contact_phone && (
                          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            📞 {team.contact_phone}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleCancelRegistration(team.id)}
                        disabled={processingTeam === team.id}
                        className="btn btn-sm"
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid rgba(220, 53, 69, 0.3)',
                          borderRadius: '4px',
                          color: '#dc3545',
                          cursor: processingTeam === team.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {processingTeam === team.id ? '⏳' : 'Otkaži'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(228, 230, 234, 0.6)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}><BiGroup/></div>
                <p>Još uvek nema potvrđenih timova</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - All Organization Teams */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="card-title">Timovi organizacije</h3>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="btn btn-primary btn-sm"
              >
                + Dodaj novi tim
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                Učitavanje timova...
              </div>
            ) : getAvailableOrgTeams().length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getAvailableOrgTeams().map(team => {
                  const teamStatus = getTeamStatus(team.id)
                  const isPending = teamStatus === 'pending'

                  return (
                    <div key={team.id} style={{
                      padding: '16px',
                      background: isPending ? 'rgba(255, 193, 7, 0.05)' : 
                                  'rgba(228, 230, 234, 0.05)',
                      border: `1px solid ${isPending ? 'rgba(255, 193, 7, 0.3)' : 
                                           'rgba(228, 230, 234, 0.2)'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ marginBottom: isPending ? '12px' : '0' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#e4e6ea' }}>
                          {team.name}
                        </h4>
                        <div style={{ fontSize: '13px', marginBottom: '4px', fontWeight: '500', color: isPending ? '#ffc107' : 'rgba(228, 230, 234, 0.7)' }}>
                          {isPending && 'Status: Na čekanju'}
                          {!teamStatus && 'Status: Nije prijavljen'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                          👥 {team.member_count} članova
                        </div>
                        {team.contact_phone && (
                          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            📞 {team.contact_phone}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveTeam(team.id)}
                              disabled={processingTeam === team.id}
                              className="btn btn-sm btn-primary"
                              style={{ flex: 1 }}
                            >
                              {processingTeam === team.id ? '⏳' : 'Potvrdi dolazak'}
                            </button>
                            <button
                              onClick={() => handleRejectApplication(team.id)}
                              disabled={processingTeam === team.id}
                              className="btn btn-sm"
                              style={{
                                flex: 1,
                                background: 'rgba(220, 53, 69, 0.1)',
                                border: '1px solid rgba(220, 53, 69, 0.3)',
                                color: '#dc3545'
                              }}
                            >
                              {processingTeam === team.id ? '⏳' : 'Odbij prijavu'}
                            </button>
                          </>
                        )}
                        
                        {!teamStatus && (
                          <button
                            onClick={() => handleApplyTeam(team.id)}
                            disabled={processingTeam === team.id}
                            className="btn btn-sm btn-primary"
                            style={{ flex: 1 }}
                          >
                            {processingTeam === team.id ? '⏳' : 'Prijavi za kviz'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={processingTeam === team.id}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(220, 53, 69, 0.15)',
                            border: '1px solid rgba(220, 53, 69, 0.4)',
                            color: '#dc3545',
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {processingTeam === team.id ? '⏳' : 'Obriši tim'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(228, 230, 234, 0.6)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}><HiDocument/></div>
                <p>Nema dostupnih timova</p>
                {/*<button*/}
                {/*  onClick={() => setShowAddTeamModal(true)}*/}
                {/*  className="btn btn-primary"*/}
                {/*  style={{ marginTop: '16px' }}*/}
                {/*>*/}
                {/*  Kreiraj novi tim*/}
                {/*</button>*/}
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
            // Automatically apply the new team to the quiz
            handleApplyTeam(newTeam.id)
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
        <h3 style={{ margin: '0 0 24px 0', color: '#e4e6ea' }}>Dodaj novi tim</h3>
        
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
              Ime tima *
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
              Broj članova u timu *
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
                Kontakt telefon
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
              Kontakt email
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
              Dodatne napomene
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
              Otkaži
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
              {loading ? 'Kreiranje u toku...' : 'Kreiraj tim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuizDetails

