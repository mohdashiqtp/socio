import { Routes, Route } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard } from '@/components/dashboard/Dashboard'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
} 