import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'
import { teamService } from '../services/teamService'
import { useAuth } from '../contexts/AuthContext'
import LoadingDragon from '../components/LoadingDragon'
import {RiDeleteBin6Line} from "react-icons/ri";
import {PiMailbox, PiTrophy} from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineDocumentText, HiOutlineTable } from "react-icons/hi";
import {BiGroup} from "react-icons/bi";
import {FaLightbulb} from "react-icons/fa";
import {MdOutlineFiberNew} from "react-icons/md";
import {AiOutlineTable} from "react-icons/ai";

function LeagueDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [league, setLeague] = useState(null)
  const [availableTeams, setAvailableTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Stanja za upravljanje
  const [isManaging, setIsManaging] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedRound, setSelectedRound] = useState(1)
  const [points, setPoints] = useState('')
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [roundResults, setRoundResults] = useState([])

  useEffect(() => {
    fetchLeagueDetails()
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      loadAvailableTeams()
    }
  }, [id, user])

  const fetchLeagueDetails = async () => {
    try {
      setLoading(true)
      const data = await leagueService.getLeague(id)
      setLeague(data)
    } catch (err) {
      console.error('Error fetching league details:', err)
      setError('Greška pri učitavanju lige: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTeams = async () => {
    try {
      if (user?.organization_id) {
        const teams = await teamService.getTeamsByOrganization(user.organization_id)
        setAvailableTeams(teams)
      }
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    
    try {
      await teamService.createTeam({ 
        name: newTeamName.trim(),
        organization_id: user.organization_id,
        member_count: 4
      })
      setNewTeamName('')
      setShowAddTeam(false)
      setSuccess('Tim je uspešno kreiran!')
      await loadAvailableTeams()
    } catch (err) {
      setError('Greška pri kreiranju tima: ' + err.message)
    }
  }

  const handleAddTeamToLeague = async () => {
    if (!selectedTeam) return
    
    try {
      await leagueService.addTeamToLeague(id, selectedTeam)
      setSelectedTeam('')
      setSuccess('Tim je uspešno dodat u ligu!')
      await fetchLeagueDetails()
    } catch (err) {
      setError('Greška pri dodavanju tima: ' + err.message)
    }
  }

  const handleAddPoints = async (e) => {
    e.preventDefault()
    if (!selectedTeam || !points) return
    
    try {
      await leagueService.enterRoundResults(id, {
        round_number: selectedRound,
        results: [{
          team_id: parseInt(selectedTeam),
          points: parseInt(points),
          position: null,
          notes: ''
        }]
      })
      
      setPoints('')
      setSuccess(`Uspešno dodati poeni za ${selectedRound}. kolo!`)
      await fetchLeagueDetails()
    } catch (err) {
      setError('Greška pri dodavanju poena: ' + err.message)
    }
  }

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Da li ste sigurni da želite da uklonite tim iz lige?')) return
    
    try {
      await leagueService.removeTeamFromLeague(id, teamId)
      setSuccess('Tim je uspešno uklonjen iz lige!')
      await fetchLeagueDetails()
    } catch (err) {
      setError('Greška pri uklanjanju tima: ' + err.message)
    }
  }

  const handleEnterResults = () => {
    if (!teams || teams.length === 0) {
      setError('Liga mora imati timove pre unosa rezultata')
      return
    }

    // Initialize results for all teams in league
    const initialResults = teams.map(team => ({
      team_id: team.id,
      team_name: team.name,
      points: 0,
      position: null,
      notes: ''
    }))
    setRoundResults(initialResults)
    setSelectedRound(1)
    setShowRoundModal(true)
    setError('')
  }

  const handleRoundSubmit = async (e) => {
    e.preventDefault()
    if (!roundResults.length) return

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

      await leagueService.enterRoundResults(id, roundData)
      setSuccess(`Rezultati ${selectedRound}. kola su uspešno uneti`)
      setShowRoundModal(false)
      await fetchLeagueDetails()
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

  const getRoundResult = (teamId, roundNumber) => {
    if (!league.rounds) return null
    return league.rounds.find(round => 
      round.team_id === teamId && round.round_number === roundNumber
    )
  }

  const getPositionStyle = (position) => {
    if (position === 1) {
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.15)', // Zlatno-žuta za prvo mesto
        color: '#e4e6ea'
      }
    } else if (position === 2) {
      return {
        backgroundColor: 'rgba(34, 139, 34, 0.15)', // Zelena za drugo mesto
        color: '#e4e6ea'
      }
    } else if (position === 3) {
      return {
        backgroundColor: 'rgba(154, 205, 50, 0.15)', // Svetlo zelena za treće mesto
        color: '#e4e6ea'
      }
    } else {
      return {
        backgroundColor: '#2c2c2c',
        color: '#e4e6ea'
      }
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

  if (error && !league) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="alert alert-warning">
            Liga nije pronađena
          </div>
        </div>
      </div>
    )
  }

  const sortedTeams = league.current_table || league.teams?.slice().sort((a, b) => {
    const aPoints = (a.pivot?.total_points ?? a.total_points) || 0
    const bPoints = (b.pivot?.total_points ?? b.total_points) || 0
    return bPoints - aPoints
  }) || []

  const teams = league.teams || []
  const totalRounds = league.total_rounds || 10
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)

  // Dostupni timovi za dodavanje (oni koji nisu u ligi)
  const teamsToAdd = availableTeams.filter(team => 
    !teams.some(leagueTeam => leagueTeam.id === team.id)
  )

  const canManage = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')

  return (
    <div className="main-content">
      <div className="container-fluid">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', fontSize: '20px', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            {success}
            <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', fontSize: '20px', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #547927 0%, #9acd32 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '28px' }}>
            <PiTrophy/> {league.name}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
            {league.season} {league.year} • {league.description}
          </p>
        </div>

        {/* Admin Controls */}
        {canManage && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/manage/leagues')}
              className="btn btn-secondary"
            >
              ← Nazad na lige
            </button>
          </div>
        )}

        {/* Management Panel */}
        {canManage && isManaging && (
          <div style={{
            background: 'rgba(228, 230, 234, 0.05)',
            border: '1px solid rgba(228, 230, 234, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#e4e6ea', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoSettingsOutline /> Upravljanje ligom
            </h3>

            {/* Dodavanje tima */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ color: 'rgba(228, 230, 234, 0.8)', marginBottom: '16px' }}>👥 Dodaj tim u ligu</h4>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#e4e6ea', fontSize: '14px' }}>
                    Izaberi tim:
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(228, 230, 234, 0.3)',
                      backgroundColor: '#3c3c3c',
                      color: '#e4e6ea',
                      minWidth: '200px'
                    }}
                  >
                    <option value="">-- Izaberi tim --</option>
                    {teamsToAdd.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddTeamToLeague}
                  disabled={!selectedTeam}
                  className="btn btn-success"
                  style={{ opacity: selectedTeam ? 1 : 0.5 }}
                >
                  + Dodaj tim
                </button>
                
                <button
                  onClick={() => setShowAddTeam(!showAddTeam)}
                  className="btn btn-secondary"
                >
                  <MdOutlineFiberNew/> Kreiraj novi tim
                </button>
              </div>

              {/* Kreiranje novog tima */}
              {showAddTeam && (
                <form onSubmit={handleCreateTeam} style={{ 
                  background: 'rgba(40, 167, 69, 0.1)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(40, 167, 69, 0.2)'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#e4e6ea', fontSize: '14px' }}>
                        Naziv novog tima:
                      </label>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(228, 230, 234, 0.3)',
                          backgroundColor: '#3c3c3c',
                          color: '#e4e6ea',
                          minWidth: '200px'
                        }}
                        placeholder="Unesi naziv tima"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-success">
                       Kreiraj
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddTeam(false)}
                      className="btn btn-secondary"
                    >
                       Otkaži
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Dodavanje rezultata */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ color: 'rgba(228, 230, 234, 0.8)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineDocumentText /> Unos rezultata kola
              </h4>

              <button
                onClick={handleEnterResults}
                disabled={!teams || teams.length === 0}
                className="btn btn-primary"
                style={{
                  opacity: teams.length > 0 ? 1 : 0.5,
                  fontSize: '16px',
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <HiOutlineDocumentText style={{ fontSize: '20px' }} />
                <span>Unesi rezultate kola</span>
              </button>

              {teams.length === 0 && (
                <p style={{ color: 'rgba(228, 230, 234, 0.6)', marginTop: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaLightbulb /> Dodajte timove u ligu pre unosa rezultata
                </p>
              )}
            </div>

            {/* Lista timova u ligi */}
            <div>
              <h4 style={{ color: 'rgba(228, 230, 234, 0.8)', marginBottom: '16px' }}>
                <BiGroup/> Timovi u ligi ({teams.length})
              </h4>
              {teams.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {teams.map(team => (
                    <div key={team.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(40, 167, 69, 0.1)',
                        opacity: 0.6,
                      borderRadius: '8px',
                      border: '1px solid rgba(40, 167, 69, 0.2)'
                    }}>
                      <span style={{ color: '#e4e6ea', fontSize: '16px' }}>
                        <PiTrophy/> {team.name}
                        <span style={{ marginLeft: '12px', color: 'rgba(228, 230, 234, 0.6)', fontSize: '14px' }}>
                          ({team.total_points || 0} poena)
                        </span>
                      </span>
                      <button
                        onClick={() => handleRemoveTeam(team.id)}
                        className="btn btn-sm"
                        style={{
                          background: 'rgba(220, 53, 69, 0.2)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)',
                          padding: '6px 12px'
                        }}
                      >
                        <RiDeleteBin6Line/> Ukloni
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(228, 230, 234, 0.6)', textAlign: 'center', padding: '20px' }}>
                  📭 Nema timova u ligi. Dodajte prvi tim!
                </p>
              )}
            </div>
          </div>
        )}
        {/* League Table */}
        {(!canManage || !isManaging) && (
          <div style={{
            background: 'rgba(228, 230, 234, 0.05)',
            border: '1px solid rgba(228, 230, 234, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              background: 'linear-gradient(135deg, #547927 0%, #9acd32 100%)',
              padding: '16px 20px',
              color: 'white',
              opacity: 0.9
            }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>📊 Tabela lige</h2>
            </div>

            {teams.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}><PiMailbox/></div>
                <h3 style={{ color: '#e4e6ea', marginBottom: '8px' }}>Nema timova u ligi</h3>
                <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>
                  {canManage ? 'Kliknite "Upravljaj ligom" da dodate timove.' : 'Liga je u pripremi.'}
                </p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(84, 121, 39, 0.1)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9acd32', border: '1px solid rgba(228, 230, 234, 0.1)', minWidth: '60px' }}>
                          #
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9acd32', border: '1px solid rgba(228, 230, 234, 0.1)', minWidth: '200px' }}>
                          Naziv ekipe
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#9acd32', border: '1px solid rgba(228, 230, 234, 0.1)', minWidth: '80px' }}>
                          Σ
                        </th>
                        {rounds.map(round => (
                          <th key={round} style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            color: '#9acd32',
                            border: '1px solid rgba(228, 230, 234, 0.1)',
                            minWidth: '60px'
                          }}>
                            {round}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((team, index) => {
                        const position = index + 1
                        const style = getPositionStyle(position)
                        
                        return (
                          <tr key={team.id} style={style}>
                            <td style={{ 
                              padding: '12px 16px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                              fontSize: '16px'
                            }}>
                              {position}
                            </td>
                            <td style={{ 
                              padding: '12px 16px',
                              fontWeight: 'bold',
                              borderRight: '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                              {position === 1 && '🥇 '}{team.name}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                              fontSize: '16px'
                            }}>
                              {(team.pivot?.total_points ?? team.total_points) || 0}
                            </td>
                            {rounds.map(round => {
                              const roundResult = getRoundResult(team.id, round)
                              
                              return (
                                <td key={round} style={{ 
                                  padding: '12px 16px', 
                                  textAlign: 'center',
                                  borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                                  fontSize: '14px'
                                }}>
                                  {roundResult ? roundResult.points : '-'}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Info */}
                <div style={{ 
                  padding: '16px 20px', 
                  background: 'rgba(228, 230, 234, 0.05)',
                  borderTop: '1px solid rgba(228, 230, 234, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px' }}>
                    <span style={{ color: league.is_active ? '#28a745' : '#dc3545', marginLeft: '8px' }}>
                      {league.is_active ? '🟢 Aktivna liga' : '🔴 Neaktivna liga'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.6)' }}>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '3px', marginRight: '6px', verticalAlign: 'middle' }}></span> 1. mesto •
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: 'rgba(34, 139, 34, 0.15)', border: '1px solid rgba(34, 139, 34, 0.3)', borderRadius: '3px', margin: '0 6px', verticalAlign: 'middle' }}></span> 2. mesto •
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: 'rgba(154, 205, 50, 0.15)', border: '1px solid rgba(154, 205, 50, 0.3)', borderRadius: '3px', margin: '0 6px', verticalAlign: 'middle' }}></span> 3. mesto
                  </div>
                </div>
              </>
            )}
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
                Unos rezultata - {league?.name}
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
                  {rounds.map(round => (
                    <option key={round} value={round}>
                      {round}. kolo
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
  )
}

export default LeagueDetails
