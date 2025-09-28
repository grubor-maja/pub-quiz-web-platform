import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingDragon from '../components/LoadingDragon'

function Dashboard() {
  const [quizzes, setQuizzes] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    organization: '',
    dateFrom: '',
    dateTo: '',
    maxPrice: '',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data || [])
        setFilteredQuizzes(data || [])
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data || [])
      }
    } catch (err) {
      console.error('Error fetching organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...quizzes]

    if (filters.search) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        quiz.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        quiz.venue.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.organization) {
      filtered = filtered.filter(quiz => 
        quiz.organization_id.toString() === filters.organization
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(quiz => quiz.date >= filters.dateFrom)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(quiz => quiz.date <= filters.dateTo)
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(quiz => quiz.fee <= parseFloat(filters.maxPrice))
    }

    filtered.sort((a, b) => new Date(a.date) - new Date(b.date))

    setFilteredQuizzes(filtered)
    setCurrentPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      organization: '',
      dateFrom: '',
      dateTo: '',
      maxPrice: '',
      search: ''
    })
    setFilteredQuizzes(quizzes)
  }

  useEffect(() => {
    fetchQuizzes()
    fetchOrganizations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, quizzes])

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage)

  const getOrganizationName = (orgId) => {
    const org = organizations.find(o => o.id === orgId)
    return org ? org.name : `Organization ${orgId}`
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
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
        <div className="hero">
          <h1 className="hero-title" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span style={{ color: '#94994F' }}>Ko</span>
            <span style={{ color: '#F2E394' }}>Zna</span>
            <span style={{ color: '#F2B441' }}>Zna</span>
            <span style={{ color: '#214a9c', marginLeft: '16px' }}>Belgrade</span>
          </h1>
          <p className="hero-subtitle">
            Discover and join the most exciting quiz events in Belgrade. Test your knowledge, meet new people, and have fun!
          </p>
        </div>

        <div className="filters">
          <div className="filter-item">
            <label>Search</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Search quizzes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ minWidth: '220px' }}
            />
          </div>

          <div className="filter-item">
            <label>Organization</label>
            <select 
              className="filter-select"
              value={filters.organization}
              onChange={(e) => handleFilterChange('organization', e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>From Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>To Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>Max Price (RSD)</label>
            <input
              type="number"
              className="filter-input"
              placeholder="1000"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              style={{ width: '120px' }}
            />
          </div>

          <div className="filter-item">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', color: 'rgba(228, 230, 234, 0.7)', fontSize: '14px' }}>
          Showing <strong>{filteredQuizzes.length}</strong> quiz{filteredQuizzes.length !== 1 ? 'es' : ''}
          {Object.values(filters).some(Boolean) && ` (filtered from ${quizzes.length} total)`}
        </div>

        {paginatedQuizzes.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
            <h3>No quizzes found</h3>
            <p>Try adjusting your filters or check back later for new quizzes.</p>
            <button className="btn btn-primary btn-lg" onClick={clearFilters} style={{ marginTop: '24px' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="quiz-grid">
              {paginatedQuizzes.map((quiz, index) => (
                <div 
                  key={quiz.id} 
                  className="quiz-card fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/quiz/${quiz.id}?mode=view`)}
                >
                  <img 
                    src={quiz.image_url || 'https://via.placeholder.com/380x220/1a1f29/214a9c?text=Quiz+Event'} 
                    alt={quiz.title}
                    className="quiz-card-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/380x220/1a1f29/214a9c?text=Quiz+Event'
                    }}
                  />
                  <div className="quiz-card-content">
                    <h3 className="quiz-card-title">{quiz.title}</h3>
                    <p className="quiz-card-description">{quiz.description}</p>
                    
                    <div style={{ margin: '20px 0', fontSize: '14px', color: 'rgba(228, 230, 234, 0.7)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ marginRight: '8px' }}>📍</span>
                        {quiz.venue}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ marginRight: '8px' }}>📅</span>
                        {formatDate(quiz.date)} at {quiz.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ marginRight: '8px' }}>👥</span>
                        Team: {quiz.min_team_size}-{quiz.max_team_size} members
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>🏢</span>
                        {getOrganizationName(quiz.organization_id)}
                      </div>
                    </div>

                    <div className="quiz-card-meta">
                      <span className="quiz-card-price">
                        {quiz.fee ? `${quiz.fee} RSD` : 'Free'}
                      </span>
                      <span style={{ fontSize: '11px' }}>
                        {new Date(quiz.date) > new Date() ? '🟢 Upcoming' : '🔴 Past'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  ← Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? 'active' : ''}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
