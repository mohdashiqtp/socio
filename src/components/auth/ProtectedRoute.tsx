import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, signInWithGoogle, isLoading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        signInWithGoogle(currentSession)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        signInWithGoogle(newSession)
      }
    })

    return () => subscription.unsubscribe()
  }, [signInWithGoogle])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
} 