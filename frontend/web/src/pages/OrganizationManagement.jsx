import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingDragon from '../components/LoadingDragon'
import {FaLightbulb} from "react-icons/fa";
import {RiDeleteBin6Line} from "react-icons/ri";

function OrganizationManagement() {
  const { user } = useAuth()
  const [userOrganizations, setUserOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newMember, setNewMember] = useState({ userId: '', role: 'MEMBER' })

  // Fetch user's organizations
  const fetchUserOrganizations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/users/me/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserOrganizations(data || [])

        // Auto-select first organization if available
        if (data && data.length > 0) {
          setSelectedOrgId(data[0].organization_id)
        } else {
          setError('Niste član nijedne organizacije')
          setLoading(false)
        }
      } else {
        setError('Neuspešno učitavanje organizacija')
        setLoading(false)
      }
    } catch (error) {
      setError('Greška mreže')
      setLoading(false)
    }
  }

  const fetchOrganization = async (orgId) => {
    if (!orgId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        setOrganizationName(data.name)
      } else {
        setError('Neuspešno učitavanje organizacije')
      }
    } catch (error) {
      setError('Greška mreže')
      console.error('Error fetching organization:', error)
    }
  }

  const fetchMembers = async (orgId) => {
    if (!orgId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${orgId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
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
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchUserOrganizations()
    fetchUsers()
  }, [])

  // Load organization data when selected org changes
  useEffect(() => {
    if (selectedOrgId) {
      setLoading(true)
      Promise.all([
        fetchOrganization(selectedOrgId),
        fetchMembers(selectedOrgId)
      ]).finally(() => setLoading(false))
    }
  }, [selectedOrgId])

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${selectedOrgId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name: organizationName }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        // Update the organization name in the list
        setUserOrganizations(prev => prev.map(org =>
          org.organization_id === selectedOrgId
            ? { ...org, organization_name: organizationName }
            : org
        ))
        alert('Organizacija je uspešno izmenjena!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Neuspešna izmena organizacije')
      }
    } catch (error) {
      setError('Greška mreže')
      console.error('Update organization error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.userId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${selectedOrgId}/members`, {
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
        fetchMembers(selectedOrgId)
        setNewMember({ userId: '', role: 'MEMBER' })
        alert('Član je uspešno dodat u organizaciju!')
      } else {
        const errorData = await response.json()
        console.error('Add member error:', errorData)
        alert(`Neuspešno dodavanje člana: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (error) {
      console.error('Add member network error:', error)
      alert('Greška mreže: ' + error.message)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (userId === user.id) {
      alert('Ne možete ukloniti sebe iz organizacije!')
      return
    }

    if (!confirm('Da li ste sigurni da želite da uklonite ovog člana iz organizacije?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${selectedOrgId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setMembers(members.filter(m => m.user_id !== userId))
        alert('Član je uspešno uklonjen iz organizacije!')
      } else {
        const errorData = await response.json()
        console.error('Remove member error:', errorData)
        alert(`Neuspešno uklanjanje člana: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (error) {
      console.error('Remove member network error:', error)
      alert('Greška mreže: ' + error.message)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/organizations/${selectedOrgId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        fetchMembers(selectedOrgId)
        alert('Uloga člana je uspešno promenjena!')
      } else {
        const errorData = await response.json()
        alert(`Neuspešna izmena uloge: ${errorData.message || errorData.error || 'Nepoznata greška'}`)
      }
    } catch (error) {
      console.error('Change role error:', error)
      alert('Greška mreže: ' + error.message)
    }
  }

  const getUserName = (userId) => {
    const userData = allUsers.find(u => u.id === userId)
    return userData ? userData.name : `User #${userId}`
  }

  const getUserEmail = (userId) => {
    const userData = allUsers.find(u => u.id === userId)
    return userData ? userData.email : ''
  }

  const availableUsers = allUsers.filter(user =>
    !members.some(member => member.user_id === user.id)
  )

  // Get current user's role in selected organization
  const currentUserRole = userOrganizations.find(org => org.organization_id === selectedOrgId)?.role

  // Check if user has admin permission for selected organization
  const hasAdminPermission = currentUserRole === 'ADMIN' || user?.is_super_admin

  if (loading && userOrganizations.length === 0) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <LoadingDragon />
        </div>
      </div>
    )
  }

  // Check if user has any organizations
  if (userOrganizations.length === 0) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <h3>Niste član nijedne organizacije</h3>
            <p>Kontaktirajte administratora da vas doda u organizaciju.</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has permission for selected organization
  if (!hasAdminPermission) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
            <h3>Nemate dozvolu za pristup</h3>
            <p>Samo administratori organizacije mogu pristupiti ovoj stranici.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Upravljanje organizacijom</h1>
          <div style={{ fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
            {organization?.name || 'Učitavanje...'}
          </div>
        </div>

        {/* Organization Selector - Show only if user has multiple organizations */}
        {userOrganizations.length > 1 && (
          <div className="card" style={{ marginBottom: '24px', background: 'rgba(33, 74, 156, 0.08)', borderColor: 'rgba(33, 74, 156, 0.3)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#214a9c', fontWeight: '600' }}>
                🏢 Izaberite organizaciju
              </label>
              <select
                value={selectedOrgId || ''}
                onChange={(e) => setSelectedOrgId(parseInt(e.target.value))}
                className="form-control"
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                {userOrganizations.map(org => (
                  <option key={org.organization_id} value={org.organization_id}>
                    {org.organization_name} ({org.role === 'ADMIN' ? 'Administrator' : 'Član'})
                  </option>
                ))}
              </select>
              <small style={{ color: 'rgba(228, 230, 234, 0.6)', marginTop: '8px', display: 'block' }}>
                Član ste {userOrganizations.length} {userOrganizations.length === 1 ? 'organizacije' : userOrganizations.length < 5 ? 'organizacije' : 'organizacija'}
              </small>
            </div>
          </div>
        )}

        {error && (
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)', marginBottom: '20px' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        {loading ? (
          <LoadingDragon />
        ) : !organization ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3>Organizacija nije pronađena</h3>
            <p>Izabrana organizacija ne postoji ili je obrisana.</p>
          </div>
        ) : (
          <>
            {/* Organization Details Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h2 className="card-title">Detalji organizacije</h2>
                <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px', margin: '8px 0 0' }}>
                  Upravljajte osnovnim informacijama o vašoj organizaciji.
                </p>
              </div>

              <form onSubmit={handleUpdateOrganization}>
                <div className="form-group">
                  <label className="form-label">Naziv organizacije *</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="form-control"
                    placeholder="Unesite naziv organizacije"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={saving || !organizationName.trim()}
                    className="btn btn-primary"
                  >
                    {saving ? 'Čuvanje izmena...' : 'Sačuvaj izmene'}
                  </button>
                </div>
              </form>
            </div>

            {/* Members Management Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Članovi organizacije ({members.length})</h2>
                <p style={{ color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px', margin: '8px 0 0' }}>
                  Dodajte, uklonite ili promenite uloge članova vaše organizacije.
                </p>
              </div>

              {/* Add New Member Form */}
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
                      <label className="form-label">Dodaj novog člana</label>
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
                          Izaberite korisnika...
                        </option>
                        {availableUsers.map(userData => (
                          <option key={userData.id} value={userData.id} style={{ background: '#2c2c2c', color: '#e4e6ea' }}>
                            {userData.name} ({userData.email})
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
                        <option value="ADMIN" style={{ background: '#2c2c2c', color: '#e4e6ea' }}>Administrator</option>
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

              {/* Members List */}
              {members.length === 0 ? (
                <div className="empty-state" style={{ margin: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
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
                        <td style={{ fontWeight: '500' }}>
                          {getUserName(member.user_id)}
                          {member.user_id === user.id && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: 'rgba(228, 230, 234, 0.6)',
                              fontWeight: 'normal'
                            }}>
                              (vi)
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'rgba(228, 230, 234, 0.8)' }}>
                          {getUserEmail(member.user_id)}
                        </td>
                        <td>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                            disabled={member.user_id === user.id}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              background: member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(33, 74, 156, 0.15)',
                              color: member.role === 'ADMIN' ? '#dc3545' : '#214a9c',
                              border: `1px solid ${member.role === 'ADMIN' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(33, 74, 156, 0.3)'}`,
                              cursor: member.user_id === user.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <option value="MEMBER">ČLAN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(220, 53, 69, 0.15)',
                              color: '#dc3545',
                              border: '1px solid rgba(220, 53, 69, 0.3)',
                              opacity: member.user_id === user.id ? 0.5 : 1,
                              cursor: member.user_id === user.id ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={member.user_id === user.id}
                            title={member.user_id === user.id ? 'Ne možete ukloniti sebe' : 'Ukloni člana'}
                          >
                            🗑<RiDeleteBin6Line/> Ukloni
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Info Card */}
            <div className="card" style={{ marginTop: '32px', background: 'rgba(33, 74, 156, 0.05)', borderColor: 'rgba(33, 74, 156, 0.2)' }}>
              <h3 className="card-subtitle" style={{ color: '#214a9c', marginTop: 0 }}><FaLightbulb/> Korisne informacije</h3>
              <ul style={{ color: 'rgba(228, 230, 234, 0.8)', fontSize: '14px', paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Samo administratori mogu upravljati članovima organizacije</li>
                <li style={{ marginBottom: '8px' }}>Članovi mogu kreirati i upravljati kvizovima u okviru organizacije</li>
                <li style={{ marginBottom: '8px' }}>Možete promeniti ulogu bilo kog člana (osim svoje)</li>
                <li>Uklanjanje člana će mu ograničiti pristup kvizovima organizacije</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default OrganizationManagement
