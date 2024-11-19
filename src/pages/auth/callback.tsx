import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Upsert user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: session.user.id,
                full_name: session.user.user_metadata.full_name,
                avatar_url: session.user.user_metadata.picture,
                email: session.user.email,
                updated_at: new Date().toISOString()
              },
              {
                onConflict: 'id'
              }
            )

          if (profileError) {
            throw profileError
          }

          // Store session in localStorage for persistence
          localStorage.setItem('supabase.auth.token', JSON.stringify(session))
          
          // Navigate to dashboard
          navigate('/dashboard', { replace: true })
        } catch (error: any) {
          setError(error.message)
          console.error('Error in auth callback:', error)
        }
      }
    }

    // Check initial session
    let mounted = true
    
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted && session) {
        await handleAuthChange('SIGNED_IN', session)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white">Setting up your account...</div>
    </div>
  )
}