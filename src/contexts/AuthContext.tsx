import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type UserProfile = Tables['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ user: User; profile: UserProfile }>;
  signUp: (email: string, password: string, fullName: string, role: 'manager' | 'employee') => Promise<void>;
  signOut: () => Promise<void>;
  inviteEmployee: (email: string, projectId: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
};

// Create context with default values to avoid undefined checks
const defaultContext: AuthContextType = {
  user: null,
  profile: null,
  loading: true,
  error: null,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signUp: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
  inviteEmployee: async () => { throw new Error('AuthContext not initialized') },
  acceptInvite: async () => { throw new Error('AuthContext not initialized') },
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No profile found for user:', userId);
        throw new Error('Profile not found');
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('Profile fetch error:', message);
      setError(message);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('Initializing auth state...');
        // Check active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session fetch error:', sessionError);
          throw sessionError;
        }

        if (mounted) {
          if (session?.user) {
            console.log('Active session found:', session.user.id);
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            console.log('No active session found');
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize auth';
        console.error('Auth initialization error:', message);
        if (mounted) {
          setError(message);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned after sign in');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw new Error('Failed to fetch user profile');
      if (!profileData) throw new Error('User profile not found');
      if (!profileData.role) throw new Error('User role not found');

      return { user: authData.user, profile: profileData };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'manager' | 'employee') => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      
      if (error) throw error;
      if (!user) throw new Error('No user returned after sign up');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        full_name: fullName,
        role
      });
      
      if (profileError) throw profileError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const inviteEmployee = async (email: string, projectId: string) => {
    const token = crypto.randomUUID();
    const { error } = await supabase.from('project_employees').insert({
      project_id: projectId,
      invite_email: email,
      invite_token: token,
      status: 'invited'
    });
    if (error) throw error;

    // In a real application, you would send an email here with the invitation link
    console.log(`Invitation link: /accept-invite?token=${token}`);
  };

  const acceptInvite = async (token: string) => {
    if (!user) throw new Error('Must be logged in to accept invite');

    const { data: invite, error: inviteError } = await supabase
      .from('project_employees')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (inviteError || !invite) throw new Error('Invalid or expired invitation');

    const { error: updateError } = await supabase
      .from('project_employees')
      .update({
        user_id: user.id,
        status: 'accepted'
      })
      .eq('invite_token', token);

    if (updateError) throw updateError;
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    inviteEmployee,
    acceptInvite,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 