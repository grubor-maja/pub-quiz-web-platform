import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoadingDragon from './components/LoadingDragon'
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
import OrganizationDetails from './pages/OrganizationDetails'
import OrganizationManagement from './pages/OrganizationManagement'
import ManageQuizzes from './pages/ManageQuizzes'
import AddQuiz from './pages/AddQuiz'
import ManageLeagues from './pages/ManageLeagues'
import LeagueForm from './pages/LeagueForm'
import EditQuiz from './pages/EditQuiz'
import Leagues from './pages/Leagues'
import LeagueDetails from './pages/LeagueDetails'
import './App.css'

function AppContent() {
  const { user, logout, loading } = useAuth()

  const handleLogout = () => {
    logout()
  }

  // Show loading screen while checking authentication
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
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container-fluid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            fontFamily: "'Unkempt', cursive",
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img 
              src="/logo1.png" 
              alt="Dragon Logo" 
              style={{ 
                width: '40px', 
                height: '40px', 
                marginRight: '8px' 
              }} 
            />
            <span style={{ color: '#94994F' }}>Ko</span>
            <span style={{ color: '#F2E394' }}>Zna</span>
            <span style={{ color: '#F2B441' }}>Zna</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user ? (
              <>
                <Link to="/" className="nav-link">Kvizovi</Link>
                <Link to="/leagues" className="nav-link">Lige</Link>
                
                {/* Organization members, admins, and super admins see management dropdown */}
                {(user.organization_id || user.is_super_admin) && (
                  <div className="dropdown">
                    <button className="dropdown-toggle">
                      Upravljanje
                      <span style={{ fontSize: '10px' }}>▼</span>
                    </button>
                    <div className="dropdown-menu">
                      <Link to="/manage/quizzes" className="dropdown-item">Kvizovima</Link>
                      <Link to="/manage/leagues" className="dropdown-item">Ligama</Link>
                      {(user.organization_id && (user.organization_role === 'admin' || user.organization_role === 'ADMIN')) && (
                        <Link to="/manage/organization" className="dropdown-item">Organizacijom</Link>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Super admins see user and organization management separately */}
                {user.is_super_admin && (
                  <>
                    <Link to="/manage/users" className="nav-link">Korisnici</Link>
                    <Link to="/manage/organizations" className="nav-link">Organizacije</Link>
                  </>
                )}
                
                <span className="nav-link">{user.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Odjavi se</button>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link">Kvizovi</Link>
                <Link to="/leagues" className="nav-link">Lige</Link>
                <Link to="/login" className="nav-link">Prijavi se</Link>
                <Link to="/register" className="nav-link">Registruj se</Link>
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
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/league/:id" element={<LeagueDetails />} />
          
          {/* Routes for organization members, admins, and super admins */}
          {(user.organization_id || user.is_super_admin) && (
            <>
              <Route path="/manage/quizzes" element={<ManageQuizzes />} />
              <Route path="/manage/quizzes/add" element={<AddQuiz />} />
              <Route path="/quiz/:id/edit" element={<EditQuiz />} />
              <Route path="/manage/leagues" element={<ManageLeagues />} />
              <Route path="/league/create" element={<LeagueForm />} />
              <Route path="/league/edit/:id" element={<LeagueForm />} />
            </>
          )}
          
          {/* Routes only for super admin */}
          {user.is_super_admin && (
            <>
              <Route path="/manage/users" element={<ManageUsers />} />
              <Route path="/manage/users/add" element={<AddUser />} />
              <Route path="/manage/users/edit/:id" element={<EditUser />} />
              <Route path="/manage/organizations/:id" element={<OrganizationDetails />} />
              <Route path="/manage/organizations" element={<ManageOrganizations />} />
              <Route path="/manage/organizations/:id" element={<OrganizationDetails />} />
              <Route path="/manage/organizations/add" element={<AddOrganization />} />
              <Route path="/manage/organizations/edit/:id" element={<EditOrganization />} />
            </>
          )}

          {/* Route for organization admins to manage their own organization */}
          {(user.organization_id && (user.organization_role === 'admin' || user.organization_role === 'ADMIN')) && (
            <Route path="/manage/organization" element={<OrganizationManagement />} />
          )}

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
