import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'
import { teamService } from '../services/teamService'
import { useAuth } from '../contexts/AuthContext'
import LoadingDragon from '../components/LoadingDragon'
import { FaRegEdit } from 'react-icons/fa'
import {RiDeleteBin6Line, RiTeamFill, RiTeamLine} from 'react-icons/ri'
import {PiCalendar, PiList, PiTrophy} from "react-icons/pi";
import {AiFillCalendar} from "react-icons/ai";
import {BiTable} from "react-icons/bi";
import {HiDocument} from "react-icons/hi";
import { PiListNumbers } from 'react-icons/pi';
function ManageLeagues() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [availableTeams, setAvailableTeams] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [selectedRound, setSelectedRound] = useState(1)
  const [roundResults, setRoundResults] = useState([])
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamMembers, setNewTeamMembers] = useState(4)
  const [newTeamPhone, setNewTeamPhone] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchLeagues = async () => {
    try {
      if (user?.role === 'super_admin') {
        const data = await leagueService.getAllLeagues()
        setLeagues(data || [])
      } else if (user?.organization_id) {
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

  const handleEnterResults = (league) => {
    if (!league.teams || league.teams.length === 0) {
      setError('Liga mora imati timove pre unosa rezultata')
      return
    }
    
    setSelectedLeague(league)
    setSelectedRound(1)
    // Initialize results for all teams in league
    const initialResults = league.teams.map(team => ({
      team_id: team.id,
      team_name: team.name,
      points: 0,
      position: null,
      notes: ''
    }))
    setRoundResults(initialResults)
    setShowRoundModal(true)
    setError('') // Clear any previous errors
  }

  const handleRoundSubmit = async (e) => {
    e.preventDefault()
    if (!selectedLeague || !roundResults.length) return

    try {
      setError('')
      const roundData = {
        round_number: selectedRound,
        results: roundResults.map(result => ({
          team_id: result.team_id,
          points: parseInt(result.points) || 0,
          position: result.position ? parseInt(result.position) : null,
          notes: result.notes || ''
        }))
      }
      
      await leagueService.enterRoundResults(selectedLeague.id, roundData)
      setSuccess(`Rezultati ${selectedRound}. kola su uspešno uneti`)
      setShowRoundModal(false)
      fetchLeagues() // Refresh data
    } catch (err) {
      setError('Greška pri unosu rezultata: ' + err.message)
    }
  }

  const updateRoundResult = (teamId, field, value) => {
    setRoundResults(prev => prev.map(result => 
      result.team_id === teamId 
        ? { ...result, [field]: value }
        : result
    ))
  }

  const handleCreateNewTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) {
      setError('Unesite naziv tima')
      return
    }

    try {
      setCreatingTeam(true)
      setError('')

      const teamData = {
        name: newTeamName.trim(),
        organization_id: user.organization_id,
        member_count: parseInt(newTeamMembers) || 4,
        contact_phone: newTeamPhone.trim() || null
      }

      const createdTeam = await teamService.createTeam(teamData)

      // Automatic adding team to league
      if (selectedLeague?.id && createdTeam?.id) {
        await leagueService.addTeamToLeague(selectedLeague.id, createdTeam.id)
        setSuccess('Tim je uspešno kreiran i dodat u ligu!')
      } else {
        setSuccess('Tim je uspešno kreiran!')
      }

      setNewTeamName('')
      setNewTeamMembers(4)
      setNewTeamPhone('')
      setShowCreateTeam(false)

      await fetchLeagues()
      await fetchAvailableTeams()
    } catch (err) {
      console.error('Create team error:', err)
      setError('Greška pri kreiranju tima: ' + err.message)
    } finally {
      setCreatingTeam(false)
    }
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><PiTrophy/></div>
              <h3>Nema kreiranih liga</h3>
              <p>Počnite kreiranje prve lige za Vašu organizaciju.</p>
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
                        <PiTrophy/> {league.name}
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
                        <span><PiCalendar/> {league.season} {league.year}</span>
                        <span><PiListNumbers/> {league.completed_rounds_count || 0} / {league.total_rounds} kola</span>
                        <span><RiTeamLine/> {league.teams?.length || 0} timova</span>
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
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '280px' }}>
                      {/* Akcije nad ligom */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '8px',
                        background: 'rgba(33, 74, 156, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(33, 74, 156, 0.2)'
                      }}>
                        <button
                          onClick={() => handleEditLeague(league)}
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                          title="Izmeni ligu"
                        >
                          <FaRegEdit /> Edituj
                        </button>
                        <button
                          onClick={() => handleDeleteLeague(league.id)}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(220, 53, 69, 0.2)',
                            color: '#dc3545',
                            border: '1px solid rgba(220, 53, 69, 0.4)',
                            fontSize: '13px',
                            padding: '8px 12px'
                          }}
                          title="Obriši ligu"
                        >
                          <RiDeleteBin6Line /> Obriši
                        </button>
                      </div>

                      {/* Pregled i upravljanje */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => setSelectedLeague(selectedLeague?.id === league.id ? null : league)}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(40, 167, 69, 0.15)',
                            color: '#28a745',
                            border: '1px solid rgba(40, 167, 69, 0.3)',
                            fontSize: '13px',
                            padding: '8px 12px'
                          }}
                          title="Upravljaj timovima"
                        >
                          <RiTeamFill /> Timovi
                        </button>
                        <button
                          onClick={() => handleEnterResults(league)}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(255, 193, 7, 0.15)',
                            color: '#ffc107',
                            border: '1px solid rgba(255, 193, 7, 0.3)',
                            fontSize: '13px',
                            padding: '8px 12px',
                            opacity: !league.teams?.length ? 0.5 : 1,
                            cursor: !league.teams?.length ? 'not-allowed' : 'pointer'
                          }}
                          disabled={!league.teams?.length}
                          title={!league.teams?.length ? 'Dodajte timove pre unosa rezultata' : 'Unesi rezultate kola'}
                        >
                          <HiDocument/> Rezultati
                        </button>
                        <button
                          onClick={() => navigate(`/league/${league.id}`)}
                          className="btn btn-sm btn-secondary"
                          style={{
                            fontSize: '13px',
                            padding: '8px 12px',
                            gridColumn: 'span 2'
                          }}
                          title="Pogledaj tabelu lige"
                        >
                          <BiTable/> Prikaži tabelu lige
                        </button>
                      </div>
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
                                <span style={{ color: '#e4e6ea' }}>
                                  {team.name} 
                                  {(team.pivot?.total_points !== undefined || team.total_points !== undefined) && (
                                    <span style={{ marginLeft: '8px', color: 'rgba(228, 230, 234, 0.6)' }}>
                                      ({team.pivot?.total_points ?? team.total_points} bodova)
                                    </span>
                                  )}
                                </span>
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
                          <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>Nema dostupnih timova za dodavanje</p>
                        )}
                      </div>

                      {/* Create New Team */}
                      <div style={{ marginTop: '24px' }}>
                        <button
                          onClick={() => setShowCreateTeam(!showCreateTeam)}
                          className="btn btn-sm btn-primary"
                          style={{ marginBottom: '16px' }}
                        >
                          {showCreateTeam ? '−' : '+'} Dodaj novi tim
                        </button>

                        {showCreateTeam && (
                          <form onSubmit={handleCreateNewTeam} style={{
                            padding: '16px',
                            background: 'rgba(40, 167, 69, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(40, 167, 69, 0.2)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-end'
                          }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea', fontSize: '14px' }}>
                                Naziv novog tima:
                              </label>
                              <input
                                type="text"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                placeholder="Unesite naziv tima..."
                                autoFocus
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(228, 230, 234, 0.3)',
                                  backgroundColor: '#3c3c3c',
                                  color: '#e4e6ea',
                                  width: '100%',
                                  fontSize: '14px'
                                }}
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={creatingTeam || !newTeamName.trim()}
                              style={{
                                padding: '10px 20px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {creatingTeam ? 'Dodavanje...' : '+ Dodaj u ligu'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateTeam(false)
                                setNewTeamName('')
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '10px 16px' }}
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enter Round Results Modal */}
        {showRoundModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#2c2c2c',
              padding: '24px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#e4e6ea' }}>
                  Unos rezultata - {selectedLeague?.name}
                </h3>
                <button
                  onClick={() => setShowRoundModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e4e6ea',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleRoundSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e4e6ea' }}>
                    Kolo:
                  </label>
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(228, 230, 234, 0.3)',
                      backgroundColor: '#3c3c3c',
                      color: '#e4e6ea',
                      width: '150px'
                    }}
                  >
                    {Array.from({ length: selectedLeague?.total_rounds || 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}. kolo
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(228, 230, 234, 0.1)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                          Tim
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                          Poeni
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                          Pozicija
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                          Napomene
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundResults.map((result) => (
                        <tr key={result.team_id}>
                          <td style={{ padding: '8px 12px', color: '#e4e6ea', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                            {result.team_name}
                          </td>
                          <td style={{ padding: '8px 12px', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                            <input
                              type="number"
                              min="0"
                              value={result.points}
                              onChange={(e) => updateRoundResult(result.team_id, 'points', e.target.value)}
                              style={{
                                width: '80px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(228, 230, 234, 0.3)',
                                backgroundColor: '#3c3c3c',
                                color: '#e4e6ea'
                              }}
                              required
                            />
                          </td>
                          <td style={{ padding: '8px 12px', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                            <input
                              type="number"
                              min="1"
                              value={result.position || ''}
                              onChange={(e) => updateRoundResult(result.team_id, 'position', e.target.value)}
                              style={{
                                width: '80px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(228, 230, 234, 0.3)',
                                backgroundColor: '#3c3c3c',
                                color: '#e4e6ea'
                              }}
                              placeholder="Opciono"
                            />
                          </td>
                          <td style={{ padding: '8px 12px', border: '1px solid rgba(228, 230, 234, 0.2)' }}>
                            <input
                              type="text"
                              value={result.notes}
                              onChange={(e) => updateRoundResult(result.team_id, 'notes', e.target.value)}
                              style={{
                                width: '150px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(228, 230, 234, 0.3)',
                                backgroundColor: '#3c3c3c',
                                color: '#e4e6ea'
                              }}
                              placeholder="Napomene..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRoundModal(false)}
                    className="btn btn-secondary"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Sačuvaj rezultate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageLeagues
