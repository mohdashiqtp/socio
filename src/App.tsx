import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthCallback from './pages/auth/callback'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './components/dashboard/Dashboard'



function App() {
  return (
    <div className="w-screen min-h-screen overflow-x-hidden">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App
