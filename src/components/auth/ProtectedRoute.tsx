import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, signInWithGoogle, isLoading } = useAuth()
  const location = useLocation()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function initializeAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          await signInWithGoogle(currentSession)
        }
        setIsInitializing(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setIsInitializing(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          await signInWithGoogle(newSession)
        }
      }
    )

    initializeAuth()

    return () => subscription.unsubscribe()
  }, [signInWithGoogle])

  // Show loading while either auth is initializing or loading
  if (isLoading || isInitializing) {
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