// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// grab env vars - will throw error if missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// creates or updates user profile after login
export const createUserProfile = async (user: any) => {
  try {
    console.log('Creating profile for user:', user);

    // try to get avatar from various oauth sources, fallback to generated one
    const avatarUrl = 
      user.identities?.[0]?.identity_data?.avatar_url || 
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.identities?.[0]?.identity_data?.picture || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.user_metadata?.full_name || user.email || 'User'
      )}`;

    // upsert to profiles table - will update if exists, create if doesn't
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.identities?.[0]?.identity_data?.full_name || 
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name,
        avatar_url: avatarUrl,
        email: user.email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
};