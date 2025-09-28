import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'

function Leagues() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrganization, setSelectedOrganization] = useState('all')
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [expandedLeagues, setExpandedLeagues] = useState(new Set())
  const [leagueTables, setLeagueTables] = useState({})
  const navigate = useNavigate()

  const fetchLeagues = async () => {
    try {
      const data = await leagueService.getAllLeagues()
      setLeagues(data || [])
    } catch (err) {
      console.error('Error fetching leagues:', err)
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
      
      // Fetch league table if not already loaded
      if (!leagueTables[leagueId]) {
        try {
          const tableData = await leagueService.getLeagueTable(leagueId)
          setLeagueTables(prev => ({ ...prev, [leagueId]: tableData }))
        } catch (err) {
          console.error('Error fetching league table:', err)
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

  const getRankIcon = (position) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `${position}.`
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
        <div className="page-header">
          <h1 className="page-title">Liga tabele</h1>
          <p style={{ color: 'rgba(228, 230, 234, 0.7)', margin: '8px 0 0 0' }}>
            Pregledajte seževe i standings za sve lige kvizova
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
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
                    {orgData.leagues.length} {orgData.leagues.length === 1 ? 'liga' : 'liga'}
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
                            🏆 {league.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                            <span>{getSeasonIcon(league.season)} {league.season} {league.year}</span>
                            <span>🎯 {league.total_rounds} kola</span>
                            <span>👥 {league.teams?.length || 0} timova</span>
                            {league.completed_rounds_count !== undefined && (
                              <span>✅ {league.completed_rounds_count} odigrano</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '20px', color: 'rgba(228, 230, 234, 0.5)' }}>
                          {expandedLeagues.has(league.id) ? '−' : '+'}
                        </div>
                      </div>

                      {/* League Table */}
                      {expandedLeagues.has(league.id) && (
                        <div style={{ padding: '20px' }}>
                          {leagueTables[league.id] ? (
                            <div>
                              <h4 style={{ margin: '0 0 16px 0', color: '#e4e6ea' }}>
                                📊 Tabela liga
                              </h4>
                              
                              {leagueTables[league.id].table && leagueTables[league.id].table.length > 0 ? (
                                <div className="table-responsive">
                                  <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    background: 'rgba(228, 230, 234, 0.05)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                  }}>
                                    <thead>
                                      <tr style={{ background: 'rgba(228, 230, 234, 0.1)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: 'none' }}>Pozicija</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#e4e6ea', border: 'none' }}>Tim</th>
                                        <th style={{ padding: '12px', textAlign: 'center', color: '#e4e6ea', border: 'none' }}>Kola</th>
                                        <th style={{ padding: '12px', textAlign: 'center', color: '#e4e6ea', border: 'none' }}>Poeni</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {leagueTables[league.id].table.map((team, index) => (
                                        <tr key={team.id} style={{
                                          borderBottom: index < leagueTables[league.id].table.length - 1 ? '1px solid rgba(228, 230, 234, 0.1)' : 'none'
                                        }}>
                                          <td style={{ padding: '12px', color: '#e4e6ea', border: 'none' }}>
                                            {getRankIcon(index + 1)}
                                          </td>
                                          <td style={{ padding: '12px', color: '#e4e6ea', fontWeight: '500', border: 'none' }}>
                                            {team.name}
                                          </td>
                                          <td style={{ padding: '12px', textAlign: 'center', color: 'rgba(228, 230, 234, 0.7)', border: 'none' }}>
                                            {team.pivot.matches_played}
                                          </td>
                                          <td style={{ 
                                            padding: '12px', 
                                            textAlign: 'center', 
                                            color: '#28a745', 
                                            fontWeight: '600',
                                            fontSize: '16px',
                                            border: 'none'
                                          }}>
                                            {team.pivot.total_points}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p style={{ color: 'rgba(228, 230, 234, 0.6)', textAlign: 'center', padding: '20px' }}>
                                  Nema rezultata za prikaz
                                </p>
                              )}

                              <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: 'rgba(228, 230, 234, 0.05)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: 'rgba(228, 230, 234, 0.7)',
                                textAlign: 'center'
                              }}>
                                Odigrano {leagueTables[league.id].completed_rounds} od {leagueTables[league.id].total_rounds} kola
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                              Učitavanje tabele...
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