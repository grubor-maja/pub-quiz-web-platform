import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
                <a href="/" className="nav-link">Dashboard</a>
                <a href="/manage/users" className="nav-link">Manage Users</a>
                <a href="/manage/organizations" className="nav-link">Manage Organizations</a>
                <a href="/manage/quizzes" className="nav-link">Manage Quizzes</a>
                <span className="nav-link">{user.name} ({user.role})</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </>
            ) : (
              <>
                <a href="/" className="nav-link">Home</a>
                <a href="/login" className="nav-link">Login</a>
                <a href="/register" className="nav-link">Register</a>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz/:id" element={<QuizDetails />} />
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
