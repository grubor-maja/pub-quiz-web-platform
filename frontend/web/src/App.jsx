import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import QuizDetails from './pages/QuizDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ManageUsers from './pages/ManageUsers'
import AddUser from './pages/AddUser'
import EditUser from './pages/EditUser'
import ManageOrganizations from './pages/ManageOrganizations'
import AddOrganization from './pages/AddOrganization'
import EditOrganization from './pages/EditOrganization'
import ManageQuizzes from './pages/ManageQuizzes'
import ManageLeagues from './pages/ManageLeagues'
import LeagueForm from './pages/LeagueForm'
import EditQuiz from './pages/EditQuiz'
import Leagues from './pages/Leagues'
import LeagueDetails from './pages/LeagueDetails'
import './App.css'

function AppContent() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container-fluid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ color: '#94994F' }}>Ko</span>
            <span style={{ color: '#F2E394' }}>Zna</span>
            <span style={{ color: '#F2B441' }}>Zna</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user ? (
              <>
                <Link to="/" className="nav-link">Dashboard</Link>
                <Link to="/leagues" className="nav-link">Leagues</Link>
                <Link to="/manage/users" className="nav-link">Manage Users</Link>
                <Link to="/manage/organizations" className="nav-link">Manage Organizations</Link>
                <Link to="/manage/quizzes" className="nav-link">Manage Quizzes</Link>
                <Link to="/manage/leagues" className="nav-link">Manage Leagues</Link>
                <span className="nav-link">{user.name} ({user.role})</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/leagues" className="nav-link">Leagues</Link>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {user ? (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz/:id" element={<QuizDetails />} />
          <Route path="/manage/users" element={<ManageUsers />} />
          <Route path="/manage/users/add" element={<AddUser />} />
          <Route path="/manage/users/edit/:id" element={<EditUser />} />
          <Route path="/manage/organizations" element={<ManageOrganizations />} />
          <Route path="/manage/organizations/add" element={<AddOrganization />} />
          <Route path="/manage/organizations/edit/:id" element={<EditOrganization />} />
          <Route path="/manage/quizzes" element={<ManageQuizzes />} />
          <Route path="/manage/leagues" element={<ManageLeagues />} />
          <Route path="/league/create" element={<LeagueForm />} />
          <Route path="/league/edit/:id" element={<LeagueForm />} />
          <Route path="/league/:id" element={<LeagueDetails />} />
          <Route path="/quiz/:id/edit" element={<EditQuiz />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz/:id" element={<QuizDetails />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/league/:id" element={<LeagueDetails />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
