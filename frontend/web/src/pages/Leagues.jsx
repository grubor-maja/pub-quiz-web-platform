import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'
import LoadingDragon from '../components/LoadingDragon'
import {HiOutlineTrophy} from "react-icons/hi2";
import {PiTrophy} from "react-icons/pi";
import {PiListNumbers} from "react-icons/pi";
function Leagues() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrganization, setSelectedOrganization] = useState('all')
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [expandedLeagues, setExpandedLeagues] = useState(new Set())
  const [leagueTables, setLeagueTables] = useState({})
  const [loadingTables, setLoadingTables] = useState({})
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchLeagues = async () => {
    try {
      const data = await leagueService.getAllLeagues()
      console.log('Fetched leagues:', data)
      setLeagues(data || [])
    } catch (err) {
      console.error('Error fetching leagues:', err)
      setError('Greška pri učitavanju liga: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeagues()
  }, [])

  const getUniqueValues = (key) => {
    const values = leagues.map(league => league[key]).filter(Boolean)
    return [...new Set(values)].sort()
  }

  const getUniqueOrganizations = () => {
    const orgs = leagues.map(league => ({
      id: league.organization_id,
      name: league.organization_name || `Organizacija ${league.organization_id}`
    })).filter((org, index, self) => 
      index === self.findIndex(o => o.id === org.id)
    )
    return orgs.sort((a, b) => a.name.localeCompare(b.name))
  }

  const filteredLeagues = leagues.filter(league => {
    if (selectedOrganization !== 'all' && league.organization_id.toString() !== selectedOrganization) {
      return false
    }
    if (selectedSeason !== 'all' && league.season !== selectedSeason) {
      return false
    }
    if (selectedYear !== 'all' && league.year.toString() !== selectedYear) {
      return false
    }
    return true
  })

  const groupedLeagues = filteredLeagues.reduce((groups, league) => {
    const orgId = league.organization_id
    if (!groups[orgId]) {
      groups[orgId] = {
        organization: league.organization_name || `Organizacija ${orgId}`,
        leagues: []
      }
    }
    groups[orgId].leagues.push(league)
    return groups
  }, {})

  const toggleLeagueExpansion = async (leagueId) => {
    const newExpanded = new Set(expandedLeagues)
    
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId)
    } else {
      newExpanded.add(leagueId)
      
      // Load real league data from backend
      if (!leagueTables[leagueId]) {
        setLoadingTables(prev => ({ ...prev, [leagueId]: true }))
        try {
          const leagueData = await leagueService.getLeague(leagueId)
          console.log('Fetched league table data:', leagueData)
          setLeagueTables(prev => ({ ...prev, [leagueId]: leagueData }))
          setError('')
        } catch (err) {
          console.error('Error fetching league table:', err)
          setError('Greška pri učitavanju tabele: ' + err.message)
        } finally {
          setLoadingTables(prev => ({ ...prev, [leagueId]: false }))
        }
      }
    }
    
    setExpandedLeagues(newExpanded)
  }

  const getSeasonIcon = (season) => {
    const icons = {
      'Prolece': '🌸',
      'Leto': '☀️',
      'Jesen': '🍂',
      'Zima': '❄️'
    }
    return icons[season] || '🏆'
  }

  const getRoundResult = (team, leagueData, roundNumber) => {
    if (!leagueData.rounds || !Array.isArray(leagueData.rounds)) return null

    // Find the round result for this specific team and round
    const result = leagueData.rounds.find(round =>
      round.team_id === team.id && round.round_number === roundNumber
    )

    return result
  }

  const getPositionStyle = (position) => {
    if (position === 1) {
      return {
        backgroundColor: '#ff6b35',
        color: '#000'
      }
    } else if (position % 2 === 0) {
      return {
        backgroundColor: '#ff6b35',
        color: '#000'
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

        <div className="page-header">
          <h1 className="page-title">Liga tabele</h1>
          <p style={{ color: 'rgba(228, 230, 234, 0.7)', margin: '8px 0 0 0' }}>
            Pregledajte trenutne rezultate omiljenih liga
          </p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Organizacija</label>
                <select
                  value={selectedOrganization}
                  onChange={e => setSelectedOrganization(e.target.value)}
                  className="form-control"
                  style={{
                    background: 'rgba(26, 31, 41, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e4e6ea'
                  }}
                >
                  <option value="all">Sve organizacije</option>
                  {getUniqueOrganizations().map(org => (
                    <option key={org.id} value={org.id.toString()}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Sezona</label>
                <select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(e.target.value)}
                  className="form-control"
                  style={{
                    background: 'rgba(26, 31, 41, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e4e6ea'
                  }}
                >
                  <option value="all">Sve sezone</option>
                  {getUniqueValues('season').map(season => (
                    <option key={season} value={season}>{getSeasonIcon(season)} {season}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Godina</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="form-control"
                  style={{
                    background: 'rgba(26, 31, 41, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e4e6ea'
                  }}
                >
                  <option value="all">Sve godine</option>
                  {getUniqueValues('year').map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {Object.keys(groupedLeagues).length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><PiTrophy/></div>
              <h3>Nema liga za prikaz</h3>
              <p>Pokušajte sa drugačijim filterima ili se javite organizatorima kvizova.</p>
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedLeagues).map(([orgId, orgData]) => (
              <div key={orgId} className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <h2 className="card-title">🏢 {orgData.organization}</h2>
                  <span style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                    {orgData.leagues.length === 1 ? 'Broj liga:' : 'Bro liga:'} {orgData.leagues.length}
                  </span>
                </div>

                <div style={{ padding: '20px' }}>
                  {orgData.leagues.map(league => (
                    <div key={league.id} style={{
                      marginBottom: '20px',
                      border: '1px solid rgba(228, 230, 234, 0.2)',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{
                          padding: '16px 20px',
                          background: 'rgba(228, 230, 234, 0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: expandedLeagues.has(league.id) ? '1px solid rgba(228, 230, 234, 0.2)' : 'none'
                        }}
                        onClick={() => toggleLeagueExpansion(league.id)}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#e4e6ea', fontSize: '18px' }}>
                            <HiOutlineTrophy/> {league.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            <span>{getSeasonIcon(league.season)} {league.season} {league.year}</span>
                            <span><PiListNumbers/> {league.total_rounds} kola</span>
                            <span>👥 {league.teams?.length || 0} timova</span>
                            {league.completed_rounds_count !== undefined && (
                              <span> {league.completed_rounds_count} odigrano</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '24px', color: '#ff6b35', fontWeight: 'bold' }}>
                          {expandedLeagues.has(league.id) ? '−' : '+'}
                        </div>
                      </div>

                      {/* League Table */}
                      {expandedLeagues.has(league.id) && (
                        <div style={{ padding: '20px' }}>
                          {loadingTables[league.id] ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                              <p style={{ color: 'rgba(228, 230, 234, 0.7)' }}>Učitavanje tabele...</p>
                            </div>
                          ) : leagueTables[league.id] ? (
                            <div style={{
                              background: 'rgba(228, 230, 234, 0.05)',
                              border: '1px solid rgba(228, 230, 234, 0.2)',
                              borderRadius: '12px',
                              overflow: 'hidden'
                            }}>
                              {/* Table Header */}
                              <div style={{
                                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                                padding: '16px 20px',
                                color: '#000',
                                fontWeight: 'bold'
                              }}>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>📊 Tabela lige - {leagueTables[league.id].name}</h2>
                              </div>

                              {leagueTables[league.id].teams && leagueTables[league.id].teams.length > 0 ? (
                                <>
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ background: 'rgba(255, 107, 53, 0.2)' }}>
                                          <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'center',
                                            color: '#ff6b35',
                                            fontWeight: 'bold',
                                            borderRight: '1px solid rgba(228, 230, 234, 0.2)',
                                            minWidth: '60px',
                                            fontSize: '16px'
                                          }}>
                                            #
                                          </th>
                                          <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            color: '#ff6b35',
                                            fontWeight: 'bold',
                                            borderRight: '1px solid rgba(228, 230, 234, 0.2)',
                                            minWidth: '200px',
                                            fontSize: '16px'
                                          }}>
                                            Naziv ekipe
                                          </th>
                                          <th style={{
                                            padding: '12px 16px',
                                            textAlign: 'center',
                                            color: '#ff6b35',
                                            fontWeight: 'bold',
                                            borderRight: '1px solid rgba(228, 230, 234, 0.2)',
                                            minWidth: '80px',
                                            fontSize: '16px'
                                          }}>
                                            Σ Ukupno
                                          </th>
                                          {Array.from({ length: leagueTables[league.id].total_rounds }, (_, i) => (
                                            <th key={i + 1} style={{
                                              padding: '12px 16px',
                                              textAlign: 'center',
                                              color: '#ff6b35',
                                              fontWeight: 'bold',
                                              borderRight: '1px solid rgba(228, 230, 234, 0.2)',
                                              minWidth: '70px',
                                              fontSize: '14px'
                                            }}>
                                              Kolo {i + 1}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {leagueTables[league.id].teams
                                          .slice()
                                          .sort((a, b) => {
                                            const aPoints = (a.pivot?.total_points ?? a.total_points) || 0
                                            const bPoints = (b.pivot?.total_points ?? b.total_points) || 0
                                            return bPoints - aPoints
                                          })
                                          .map((team, index) => {
                                            const position = index + 1
                                            const style = getPositionStyle(position)
                                            const totalPoints = (team.pivot?.total_points ?? team.total_points) || 0

                                            return (
                                              <tr key={team.id} style={style}>
                                                <td style={{
                                                  padding: '12px 16px',
                                                  textAlign: 'center',
                                                  fontWeight: 'bold',
                                                  borderRight: '2px solid rgba(0, 0, 0, 0.2)',
                                                  fontSize: '18px'
                                                }}>
                                                  {position}
                                                </td>
                                                <td style={{
                                                  padding: '12px 16px',
                                                  fontWeight: position <= 3 ? 'bold' : 'normal',
                                                  borderRight: '2px solid rgba(0, 0, 0, 0.2)',
                                                  fontSize: '15px'
                                                }}>
                                                  {position === 1 && '🥇 '}
                                                  {position === 2 && '🥈 '}
                                                  {position === 3 && '🥉 '}
                                                  {team.name}
                                                </td>
                                                <td style={{
                                                  padding: '12px 16px',
                                                  textAlign: 'center',
                                                  fontWeight: 'bold',
                                                  borderRight: '2px solid rgba(0, 0, 0, 0.2)',
                                                  fontSize: '18px'
                                                }}>
                                                  {totalPoints}
                                                </td>
                                                {Array.from({ length: leagueTables[league.id].total_rounds }, (_, i) => {
                                                  const roundNumber = i + 1
                                                  const roundResult = getRoundResult(team, leagueTables[league.id], roundNumber)

                                                  return (
                                                    <td key={roundNumber} style={{
                                                      padding: '12px 16px',
                                                      textAlign: 'center',
                                                      borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                                                      fontSize: '15px',
                                                      fontWeight: roundResult ? '500' : 'normal'
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
                                    borderTop: '1px solid rgba(228, 230, 234, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '16px',
                                    fontSize: '14px'
                                  }}>
                                    <div style={{ color: 'rgba(228, 230, 234, 0.8)' }}>
                                      👥 <strong>{leagueTables[league.id].teams.length}</strong> timova •
                                      🎯 <strong>{leagueTables[league.id].completed_rounds_count || 0}</strong>/{leagueTables[league.id].total_rounds} odigranih kola •
                                      <span style={{
                                        color: leagueTables[league.id].is_active ? '#28a745' : '#dc3545',
                                        marginLeft: '8px',
                                        fontWeight: 'bold'
                                      }}>
                                        {leagueTables[league.id].is_active ? '🟢 Aktivna liga' : '🔴 Završena liga'}
                                      </span>
                                    </div>

                                    <div style={{ color: 'rgba(228, 230, 234, 0.7)' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        background: '#ff6b35',
                                        marginRight: '6px',
                                        verticalAlign: 'middle',
                                        borderRadius: '2px'
                                      }}></span>
                                      1. mesto i parni redovi •
                                      <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        background: '#2c2c2c',
                                        margin: '0 6px 0 10px',
                                        verticalAlign: 'middle',
                                        borderRadius: '2px',
                                        border: '1px solid rgba(228, 230, 234, 0.3)'
                                      }}></span>
                                      Neparni redovi
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                                  <h3 style={{ color: '#e4e6ea', marginBottom: '8px' }}>Nema timova u ligi</h3>
                                  <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>
                                    Liga je u pripremi. Timovi će uskoro biti dodati.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                              <p style={{ color: 'rgba(228, 230, 234, 0.6)' }}>Greška pri učitavanju tabele</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Leagues