import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { leagueService } from '../services/leagueService'

function LeagueDetails() {
  const [league, setLeague] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [selectedRound, setSelectedRound] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchLeague = async () => {
    try {
      const data = await leagueService.getLeagueById(id)
      setLeague(data)
    } catch (err) {
      console.error('Error fetching league:', err)
      setError('Greška pri učitavanju lige: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchLeague()
    }
  }, [id])

  const handleEnterResults = async (roundData) => {
    try {
      await leagueService.enterRoundResults(id, roundData)
      setSuccess('Rezultati kola su uspešno zabeleženi!')
      setShowRoundModal(false)
      await fetchLeague() // Refresh data
    } catch (err) {
      console.error('Error entering results:', err)
      setError('Greška pri unosu rezultata: ' + err.message)
    }
  }

  const getRankIcon = (position) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `${position}.`
  }

  const getSeasonIcon = (season) => {
    const icons = { 'Prolece': '🌸', 'Leto': '☀️', 'Jesen': '🍂', 'Zima': '❄️' }
    return icons[season] || '🏆'
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            Učitavanje lige...
          </div>
        </div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state" style={{ margin: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>Liga nije pronađena</h3>
            <button onClick={() => navigate('/leagues')} className="btn btn-primary">
              Nazad na lige
            </button>
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
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 {league.name}</h1>
            <div style={{ display: 'flex', gap: '16px', fontSize: '16px', color: 'rgba(228, 230, 234, 0.7)', marginTop: '8px' }}>
              <span>{getSeasonIcon(league.season)} {league.season} {league.year}</span>
              <span>🎯 {league.total_rounds} kola</span>
              <span>👥 {league.teams?.length || 0} timova</span>
              <span>✅ {league.completed_rounds_count || 0} odigrano</span>
            </div>
            {league.description && (
              <p style={{ marginTop: '12px', color: 'rgba(228, 230, 234, 0.8)' }}>{league.description}</p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate('/leagues')}
              className="btn btn-secondary"
            >
              ← Nazad na lige
            </button>
            {league.next_round_number && (
              <button 
                onClick={() => {
                  setSelectedRound(league.next_round_number)
                  setShowRoundModal(true)
                }}
                className="btn btn-primary"
              >
                📝 Unesi rezultate {league.next_round_number}. kola
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* League Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📊 Tabela lige</h2>
            </div>
            
            {league.current_table && league.current_table.length > 0 ? (
              <div className="table-responsive">
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'rgba(228, 230, 234, 0.05)'
                }}>
                  <thead>
                    <tr style={{ background: 'rgba(228, 230, 234, 0.1)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6ea', border: 'none' }}>Pozicija</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6ea', border: 'none' }}>Tim</th>
                      <th style={{ padding: '16px', textAlign: 'center', color: '#e4e6ea', border: 'none' }}>Odigrano</th>
                      <th style={{ padding: '16px', textAlign: 'center', color: '#e4e6ea', border: 'none' }}>Poeni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {league.current_table.map((team, index) => (
                      <tr key={team.id} style={{
                        borderBottom: index < league.current_table.length - 1 ? '1px solid rgba(228, 230, 234, 0.1)' : 'none',
                        background: index < 3 ? 'rgba(255, 193, 7, 0.05)' : 'transparent'
                      }}>
                        <td style={{ padding: '16px', color: '#e4e6ea', border: 'none', fontSize: '18px' }}>
                          {getRankIcon(index + 1)}
                        </td>
                        <td style={{ padding: '16px', color: '#e4e6ea', fontWeight: '500', border: 'none' }}>
                          {team.name}
                          {index < 3 && <span style={{ marginLeft: '8px', fontSize: '12px' }}>🏅</span>}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: 'rgba(228, 230, 234, 0.7)', border: 'none' }}>
                          {team.pivot.matches_played}
                        </td>
                        <td style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          color: '#28a745', 
                          fontWeight: '600',
                          fontSize: '18px',
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
              <div className="empty-state" style={{ margin: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <h3>Nema rezultata</h3>
                <p>Unesite rezultate prvog kola da počnete tabelu.</p>
              </div>
            )}
          </div>

          {/* Rounds Progress */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🎯 Kola</h2>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(40, 167, 69, 0.1)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold' }}>
                  {league.completed_rounds_count || 0} / {league.total_rounds}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)', marginTop: '4px' }}>
                  Odiganih kola
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {Array.from({ length: league.total_rounds }, (_, i) => {
                  const roundNumber = i + 1
                  const isCompleted = league.completed_rounds_count >= roundNumber
                  const isNext = league.next_round_number === roundNumber
                  
                  return (
                    <div key={roundNumber} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: isCompleted ? 'rgba(40, 167, 69, 0.1)' : 
                                  isNext ? 'rgba(255, 193, 7, 0.1)' : 
                                  'rgba(228, 230, 234, 0.05)',
                      border: `1px solid ${isCompleted ? 'rgba(40, 167, 69, 0.2)' : 
                                           isNext ? 'rgba(255, 193, 7, 0.2)' : 
                                           'rgba(228, 230, 234, 0.1)'}`,
                      borderRadius: '6px'
                    }}>
                      <span style={{ color: '#e4e6ea' }}>
                        {roundNumber}. kolo
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        {isCompleted ? '✅' : isNext ? '⏳' : '⚪'}
                      </span>
                      {isNext && (
                        <button
                          onClick={() => {
                            setSelectedRound(roundNumber)
                            setShowRoundModal(true)
                          }}
                          className="btn btn-xs btn-primary"
                          style={{ marginLeft: '8px' }}
                        >
                          Unesi
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round Results Modal */}
      {showRoundModal && (
        <RoundResultsModal
          league={league}
          roundNumber={selectedRound}
          onClose={() => {
            setShowRoundModal(false)
            setError('')
            setSuccess('')
          }}
          onSave={handleEnterResults}
        />
      )}
    </div>
  )
}

// Round Results Modal Component
function RoundResultsModal({ league, roundNumber, onClose, onSave }) {
  const [results, setResults] = useState(
    league.teams?.map(team => ({
      team_id: team.id,
      team_name: team.name,
      points: '',
      position: '',
      notes: ''
    })) || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleResultChange = (teamId, field, value) => {
    setResults(prev => prev.map(result => 
      result.team_id === teamId ? { ...result, [field]: value } : result
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validate results
    const validResults = results.map(result => ({
      team_id: result.team_id,
      points: parseInt(result.points) || 0,
      position: result.position ? parseInt(result.position) : null,
      notes: result.notes || null
    }))

    const hasInvalidPoints = validResults.some(result => result.points < 0)
    if (hasInvalidPoints) {
      setError('Poeni ne mogu biti negativni')
      setSaving(false)
      return
    }

    try {
      await onSave({
        round_number: roundNumber,
        results: validResults
      })
    } catch (err) {
      setError('Greška pri čuvanju: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">📝 Rezultati {roundNumber}. kola</h3>
            <button onClick={onClose} className="modal-close">×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              {results.map(result => (
                <div key={result.team_id} style={{
                  padding: '16px',
                  background: 'rgba(228, 230, 234, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(228, 230, 234, 0.1)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#e4e6ea' }}>
                    {result.team_name}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Poeni *</label>
                      <input
                        type="number"
                        value={result.points}
                        onChange={e => handleResultChange(result.team_id, 'points', e.target.value)}
                        className="form-control"
                        min="0"
                        required
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Pozicija</label>
                      <input
                        type="number"
                        value={result.position}
                        onChange={e => handleResultChange(result.team_id, 'position', e.target.value)}
                        className="form-control"
                        min="1"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: '12px 0 0 0' }}>
                    <label>Napomene</label>
                    <input
                      type="text"
                      value={result.notes}
                      onChange={e => handleResultChange(result.team_id, 'notes', e.target.value)}
                      className="form-control"
                      placeholder="Dodatne napomene (opciono)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Otkaži
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj rezultate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeagueDetails