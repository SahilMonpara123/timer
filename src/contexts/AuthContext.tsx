import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Tables['profiles'] | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'manager' | 'employee') => Promise<void>;
  signOut: () => Promise<void>;
  inviteEmployee: (email: string, projectId: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables['profiles'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'manager' | 'employee') => {
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

    if (user) {
      await supabase.from('profiles').insert({
        id: user.id,
        email,
        full_name: fullName,
        role
      });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 