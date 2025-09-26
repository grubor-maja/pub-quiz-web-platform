import { useState, useEffect } from 'react'

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data || [])
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-fluid">
          <div className="loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            Loading quizzes...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header">
          <h1 className="page-title">Manage Quizzes</h1>
          <button className="btn btn-primary">
            + Add New Quiz
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Quizzes ({quizzes.length})</h2>
          </div>
          
          {quizzes.length === 0 ? (
            <div className="empty-state" style={{ margin: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3>No quizzes found</h3>
              <p>Start by creating your first quiz event.</p>
            </div>
          ) : (
            <div className="quiz-grid">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="quiz-card">
                  <img 
                    src={quiz.image_url || 'https://via.placeholder.com/380x220/1a1f29/214a9c?text=Quiz+Event'} 
                    alt={quiz.title}
                    className="quiz-card-image"
                  />
                  <div className="quiz-card-content">
                    <h3 className="quiz-card-title">{quiz.title}</h3>
                    <p className="quiz-card-description">{quiz.description}</p>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button className="btn btn-sm btn-secondary">
                        ✏️ Edit
                      </button>
                      <button className="btn btn-sm" style={{ 
                        background: 'rgba(220, 53, 69, 0.15)',
                        color: '#dc3545',
                        border: '1px solid rgba(220, 53, 69, 0.3)'
                      }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageQuizzes