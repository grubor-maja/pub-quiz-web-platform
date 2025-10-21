import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import {RiDeleteBin6Line} from "react-icons/ri";

function EditOrganization() {
  const [organization, setOrganization] = useState(null)
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newMember, setNewMember] = useState({ userId: '', role: 'MEMBER' })
  const { id } = useParams()
  const navigate = useNavigate()

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        setName(data.name)
      } else {
        setError('Neuspešno učitavanje organizacije')
      }
    } catch (err) {
      setError('Greška mreže')
    }
  }

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data || [])
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/manage/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAllUsers(data || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/manage/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        alert('Organizacija uspešno izmenjena.')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Neuspešna izmena organizacije')
      }
    } catch (err) {
      setError('Greška mreže')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.userId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(newMember.userId),
          role: newMember.role
        }),
      })

      if (response.ok) {
        fetchMembers()
        setNewMember({ userId: '', role: 'MEMBER' })
        alert('Član je uspešno dodat!')
      } else {
        const errorData = await response.json()
        console.error('Add member error:', errorData)
        alert(`Neuspešno dodavanje člana: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (err) {
      console.error('Add member network error:', err)
      alert('Greška mreže: ' + err.message)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Da li ste sigurni da želite da uklonite ovog člana?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setMembers(members.filter(m => m.user_id !== userId))
        alert('Član je uspešno uklonjen!')
      } else {
        const errorData = await response.json()
        console.error('Remove member error:', errorData)
        alert(`Neuspešno uklanjanje člana: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (err) {
      console.error('Remove member network error:', err)
      alert('Greška mreže: ' + err.message)
    }
  }

  useEffect(() => {
    fetchOrganization()
    fetchMembers()
    fetchUsers()
  }, [id])

  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.name : `User #${userId}`
  }

  const getUserEmail = (userId) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.email : ''
  }

  const availableUsers = allUsers.filter(user => 
    !members.some(member => member.user_id === user.id)
  )

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <LoadingDragon />
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>Organizacija nije pronađena</h3>
            <p>Organizacija koju tražite ne postoji ili nemate dozvolu za pristup.</p>
            <button
              onClick={() => navigate('/manage/organizations')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '24px' }}
            >
              Nazad na organizacije
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Izmeni organizaciju</h1>
          <button 
            onClick={() => navigate('/manage/organizations')}
            className="btn btn-secondary"
          >
            ← Nazad
          </button>
        </div>

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Detalji organizacije</h2>
          </div>

          <form onSubmit={handleUpdateOrganization}>
            <div className="form-group">
              <label className="form-label">Ime organizacije *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control"
                placeholder="Unesite naziv organizacije"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={saving || !name.trim()}
                className="btn btn-primary"
              >
                {saving ? 'Izmena u toku...' : 'Izmeni organizaciju'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Članovi organizacije ({members.length})</h2>
          </div>

          {availableUsers.length > 0 && (
            <form onSubmit={handleAddMember} style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'end', 
                flexWrap: 'wrap',
                padding: '24px',
                background: 'rgba(33, 74, 156, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(33, 74, 156, 0.1)'
              }}>
                <div className="form-group" style={{ minWidth: '250px', marginBottom: 0 }}>
                  <label className="form-label">Izaberi korisnika</label>
                  <select
                    value={newMember.userId}
                    onChange={(e) => setNewMember({...newMember, userId: e.target.value})}
                    className="form-control"
                    style={{
                      background: 'rgba(26, 31, 41, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e4e6ea'
                    }}
                    required
                  >
                    <option value="" style={{ background: '#2c2c2c', color: '#e4e6ea' }}>
                      Izaberi korisnika...
                    </option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id} style={{ background: '#2c2c2c', color: '#e4e6ea' }}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ minWidth: '120px', marginBottom: 0 }}>
                  <label className="form-label">Uloga</label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="form-control"
                    style={{
                      background: 'rgba(26, 31, 41, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e4e6ea'
                    }}
                  >
                    <option value="MEMBER" style={{ background: '#2c2c2c', color: '#e4e6ea' }}>Član</option>
                    <option value="ADMIN" style={{ background: '#2c2c2c', color: '#e4e6ea' }}>Admin</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newMember.userId}
                >
                  Dodaj člana
                </button>
              </div>
            </form>
          )}

          {members.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h3>Nema članova</h3>
              <p>Dodajte članove u vašu organizaciju da biste zajedno upravljali kvizovima.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ime</th>
                  <th>Email</th>
                  <th>Uloga</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.user_id}>
                    <td style={{ fontWeight: '500' }}>{getUserName(member.user_id)}</td>
                    <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>{getUserEmail(member.user_id)}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(33, 74, 156, 0.15)',
                        color: member.role === 'ADMIN' ? '#dc3545' : '#214a9c',
                        border: `1px solid ${member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(33, 74, 156, 0.3)'}`
                      }}>
                        {member.role === 'ADMIN' ? 'ADMIN' : 'ČLAN'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        style={{ 
                          background: 'rgba(220, 53, 69, 0.15)',
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                          <RiDeleteBin6Line/> Ukloni
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditOrganization
