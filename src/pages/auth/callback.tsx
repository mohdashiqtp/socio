import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // handles auth state changes and creates/updates user profile
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // save user info to profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: session.user.user_metadata.full_name,
              avatar_url: session.user.user_metadata.picture,
              email: session.user.email,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            // double check profile was saved correctly
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            console.log('Created profile:', profile);
          }

          navigate('/dashboard');
        } catch (error) {
          console.error('Error in auth callback:', error);
        }
      }
    };

    // check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange('SIGNED_IN', session);
      }
    });

    // setup listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white">Setting up your account...</div>
    </div>
  );
} 