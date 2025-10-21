import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'
import { RiTeamFill, RiDeleteBin6Line } from 'react-icons/ri'
import { HiInformationCircle } from 'react-icons/hi'
import { FaRegEdit } from 'react-icons/fa'

function OrganizationDetails() {
  const { id } = useParams()
  const [organization, setOrganization] = useState(null)
  const [members, setMembers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAllUsers = async () => {
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
          setUsers(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }

    const fetchOrganizationDetails = async () => {
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
          console.log('Fetched organization data:', data)
          setOrganization(data)
        } else {
          setError('Nije moguće učitati organizaciju')
        }
      } catch {
        setError('Greška mreže')
      } finally {
        setLoading(false)
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
          console.log('Fetched members data:', data)
          setMembers(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch members:', err)
      }
    }

    fetchAllUsers()
    fetchOrganizationDetails()
    fetchMembers()
  }, [id])

  // Helper function to get user by ID
  const getUserById = (userId) => {
    return users.find(u => u.id === userId)
  }

  // Helper function to get creator name
  const getCreatorName = () => {
    if (!organization) return ''
    const creator = getUserById(organization.created_by)
    return creator ? creator.name : `User #${organization.created_by}`
  }

  // Helper function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('sr-Latn-RS', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
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

  if (error || !organization) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="card" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
            <p style={{ color: '#dc3545', margin: 0 }}>❌ {error || 'Organizacija nije pronađena'}</p>
          </div>
          <Link to="/manage/organizations" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            ← Nazad na organizacije
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <div>
            <Link
              to="/manage/organizations"
              className="btn btn-secondary"
              style={{
                display: 'inline-block',
                marginBottom: '12px'
              }}
            >
              ← Nazad na sve organizacije
            </Link>
            <h1 className="page-title" style={{ marginTop: '8px' }}>
              {organization.name}
            </h1>
          </div>
          <Link
            to={`/manage/organizations/edit/${id}`}
            className="btn btn-primary"
          >
            <FaRegEdit style={{ marginRight: '6px' }} />
            Izmeni organizaciju
          </Link>
        </div>

        {/* Organization Info Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <HiInformationCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Informacije o organizaciji
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{
                  color: 'rgba(228, 230, 234, 0.6)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  ID Organizacije
                </label>
                <p style={{
                  color: '#e4e6ea',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  #{organization.id}
                </p>
              </div>

              <div>
                <label style={{
                  color: 'rgba(228, 230, 234, 0.6)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Naziv
                </label>
                <p style={{
                  color: '#e4e6ea',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {organization.name}
                </p>
              </div>

              <div>
                <label style={{
                  color: 'rgba(228, 230, 234, 0.6)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Kreirao
                </label>
                <p style={{
                  color: '#e4e6ea',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {getCreatorName()}
                </p>
              </div>

              <div>
                <label style={{
                  color: 'rgba(228, 230, 234, 0.6)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Datum kreiranja
                </label>
                <p style={{
                  color: '#e4e6ea',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {formatDate(organization.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <RiTeamFill style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Članovi organizacije ({members.length})
            </h2>
          </div>

          {members.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Korisnik</th>
                  <th>Email</th>
                  <th>Uloga u organizaciji</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const user = getUserById(member.user_id)
                  return (
                    <tr key={member.user_id}>
                      <td style={{ fontWeight: '500' }}>
                        {user ? user.name : `User #${member.user_id}`}
                      </td>
                      <td style={{ color: 'rgba(228, 230, 234, 0.7)' }}>
                        {user ? user.email : 'N/A'}
                      </td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: member.role === 'ADMIN' ? 'rgba(33, 74, 156, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: member.role === 'ADMIN' ? '#4a9eff' : 'rgba(228, 230, 234, 0.8)',
                          border: `1px solid ${member.role === 'ADMIN' ? 'rgba(33, 74, 156, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`
                        }}>
                          {member.role}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <RiTeamFill style={{ fontSize: '48px', marginBottom: '16px' }} />
              <h3>Nema članova</h3>
              <p>Ova organizacija još nema dodeljene članove.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrganizationDetails
