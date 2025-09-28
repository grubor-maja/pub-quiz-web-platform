import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'
import { teamService } from '../services/teamService'
import { useAuth } from '../contexts/AuthContext'

function ManageLeagues() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [availableTeams, setAvailableTeams] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchLeagues = async () => {
    try {
      if (user?.role === 'super_admin') {
        // Super admin can see all leagues
        const data = await leagueService.getAllLeagues()
        setLeagues(data || [])
      } else if (user?.organization_id) {
        // Admin can see only their organization's leagues
        const data = await leagueService.getLeaguesByOrganization(user.organization_id)
        setLeagues(data || [])
      }
    } catch (err) {
      console.error('Error fetching leagues:', err)
      setError('Greška pri učitavanju liga: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTeams = async () => {
    try {
      if (user?.organization_id) {
        const data = await teamService.getTeamsByOrganization(user.organization_id)
        setAvailableTeams(data || [])
      }
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  useEffect(() => {
    fetchLeagues()
    fetchAvailableTeams()
  }, [user?.organization_id, user?.role])

  const handleCreateLeague = () => {
    navigate('/league/create')
  }

  const handleEditLeague = (league) => {
    navigate(`/league/edit/${league.id}`)
  }

  const handleDeleteLeague = async (leagueId) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu ligu? Ova akcija ne može biti poništena.')) {
      return
    }

    try {
      await leagueService.deleteLeague(leagueId)
      setSuccess('Liga je uspešno obrisana!')
      await fetchLeagues()
    } catch (err) {
      console.error('Delete league error:', err)
      setError('Greška pri brisanju lige: ' + err.message)
    }
  }

  const handleAddTeamToLeague = async (leagueId, teamId) => {
    try {
      await leagueService.addTeamToLeague(leagueId, teamId)
      setSuccess('Tim je uspešno dodat u ligu!')
      await fetchLeagues()
    } catch (err) {
      console.error('Add team error:', err)
      setError('Greška pri dodavanju tima: ' + err.message)
    }
  }

  const handleRemoveTeamFromLeague = async (leagueId, teamId) => {
    if (!confirm('Da li ste sigurni da želite da uklonite tim iz lige?')) {
      return
    }

    try {
      await leagueService.removeTeamFromLeague(leagueId, teamId)
      setSuccess('Tim je uspešno uklonjen iz lige!')
      await fetchLeagues()
    } catch (err) {
      console.error('Remove team error:', err)
      setError('Greška pri uklanjanju tima: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            Učitavanje liga...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
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
            <button 
              onClick={() => setSuccess('')}
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

        <div className="page-header">
          <h1 className="page-title">Upravljanje ligama</h1>
          <button 
            onClick={handleCreateLeague}
            className="btn btn-primary"
          >
            + Kreiraj novu ligu
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Sve lige ({leagues.length})</h2>
          </div>
          
          {leagues.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
              <h3>Nema kreiranje liga</h3>
              <p>Počnite kreiranje prve lige za vašu organizaciju.</p>
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              {leagues.map(league => (
                <div key={league.id} style={{
                  marginBottom: '24px',
                  padding: '20px',
                  background: 'rgba(228, 230, 234, 0.05)',
                  border: '1px solid rgba(228, 230, 234, 0.2)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#e4e6ea', fontSize: '20px' }}>
                        🏆 {league.name}
                        {user?.role === 'super_admin' && (
                          <span style={{ 
                            fontSize: '12px', 
                            marginLeft: '12px',
                            color: 'rgba(228, 230, 234, 0.6)',
                            fontWeight: 'normal'
                          }}>
                            ({league.organization?.name || `Org #${league.organization_id}`})
                          </span>
                        )}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                        <span>📅 {league.season} {league.year}</span>
                        <span>🎯 {league.total_rounds} kola</span>
                        <span>👥 {league.teams?.length || 0} timova</span>
                        <span style={{
                          color: league.is_active ? '#28a745' : '#dc3545'
                        }}>
                          {league.is_active ? '🟢 Aktivna' : '🔴 Neaktivna'}
                        </span>
                      </div>
                      {league.description && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(228, 230, 234, 0.8)' }}>
                          {league.description}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedLeague(selectedLeague?.id === league.id ? null : league)}
                        className="btn btn-sm btn-primary"
                      >
                        👥 {selectedLeague?.id === league.id ? 'Sakrij' : 'Timovi'}
                      </button>
                      <button 
                        onClick={() => navigate(`/league/${league.id}`)}
                        className="btn btn-sm btn-secondary"
                      >
                        📊 Tabela
                      </button>
                      <button 
                        onClick={() => handleEditLeague(league)}
                        className="btn btn-sm btn-secondary"
                      >
                        ✏️ Edituj
                      </button>
                      <button 
                        onClick={() => handleDeleteLeague(league.id)}
                        className="btn btn-sm" 
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                      >
                        🗑️ Obriši
                      </button>
                    </div>
                  </div>

                  {/* Teams Management */}
                  {selectedLeague?.id === league.id && (
                    <div style={{
                      padding: '16px',
                      background: 'rgba(228, 230, 234, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(228, 230, 234, 0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', color: '#e4e6ea' }}>Upravljanje timovima</h4>
                      
                      {/* Current Teams */}
                      <div style={{ marginBottom: '20px' }}>
                        <h5 style={{ margin: '0 0 12px 0', color: 'rgba(228, 230, 234, 0.8)' }}>
                          Timovi u ligi ({league.teams?.length || 0})
                        </h5>
                        {league.teams && league.teams.length > 0 ? (
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {league.teams.map(team => (
                              <div key={team.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'rgba(40, 167, 69, 0.1)',
                                borderRadius: '6px',
                                border: '1px solid rgba(40, 167, 69, 0.2)'
                              }}>
                                <span style={{ color: '#e4e6ea' }}>{team.name}</span>
                                <button
                                  onClick={() => handleRemoveTeamFromLeague(league.id, team.id)}
                                  className="btn btn-xs"
                                  style={{
                                    background: 'rgba(220, 53, 69, 0.2)',
                                    color: '#dc3545',
                                    border: '1px solid rgba(220, 53, 69, 0.3)',
                                    padding: '4px 8px',
                                    fontSize: '12px'
                                  }}
                                >
                                  Ukloni
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>Nema timova u ligi</p>
                        )}
                      </div>

                      {/* Add Team */}
                      <div>
                        <h5 style={{ margin: '0 0 12px 0', color: 'rgba(228, 230, 234, 0.8)' }}>
                          Dodaj tim u ligu
                        </h5>
                        {availableTeams.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {availableTeams
                              .filter(team => !league.teams?.some(lt => lt.id === team.id))
                              .map(team => (
                              <button
                                key={team.id}
                                onClick={() => handleAddTeamToLeague(league.id, team.id)}
                                className="btn btn-xs btn-primary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                + {team.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>Nema dostupnih timova</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageLeagues