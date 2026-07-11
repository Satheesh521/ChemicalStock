import { supabase } from '@/lib/supabase';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Simple User type
export type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'manager';
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ HELPER FUNCTION: Fixes the "not assignable to type 'never'" error
  const createBasicUser = (id: string, email: string, fullName?: string): User => {
    return {
      id,
      email,
      name: fullName || null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('✅ Session found, fetching profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const profile = profileData as User | null;

          if (profile && !profileError) {
            console.log('✅ Profile loaded:', profile.email);
            setUser(profile);
          } else {
            console.warn('⚠️ Profile not found, creating basic user');
            setUser(createBasicUser(
              session.user.id,
              session.user.email || '',
              (session.user.user_metadata as any)?.full_name
            ));
          }
        } else {
          console.log('ℹ️ No active session');
        }
      } catch (err) {
        console.error('❌ Error checking session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);

        if (session?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            const profile = profileData as User | null;

            if (profile && !profileError) {
              console.log('✅ Profile loaded in auth change:', profile.email);
              setUser(profile);
            } else {
              console.warn('⚠️ Profile not found in auth change');
              setUser(createBasicUser(
                session.user.id,
                session.user.email || '',
                (session.user.user_metadata as any)?.full_name
              ));
            }
          } catch (err) {
            console.error('❌ Error in auth state change:', err);
          }
        } else {
          console.log('👋 User signed out');
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      console.log(' Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Login attempt:', email);
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Auth response:', {
        userExists: !!data?.user,
        hasError: !!authError
      });

      if (authError) {
        console.error('❌ Auth error:', authError.message);
        setError(authError.message);
        throw authError;
      }

      if (data.user) {
        console.log('✅ User authenticated, fetching profile...');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const profile = profileData as User | null;

        console.log('📋 Profile fetch:', {
          found: !!profile,
          hasError: !!profileError
        });

        if (profile && !profileError) {
          console.log('✅ Login successful!');
          setUser(profile);
        } else {
          console.warn('⚠️ Profile not found, using basic user');
          setUser(createBasicUser(
            data.user.id,
            data.user.email || '',
            (data.user.user_metadata as any)?.full_name
          ));
        }
      }
    } catch (err: any) {
      console.error('💥 Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('📝 Registration attempt:', email);
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
        console.error('❌ Registration error:', authError);
        setError(authError.message);
        throw authError;
      }

      if (authData.user) {
        console.log('✅ User created, creating profile...');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: email,
            name: name || null,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }] as any);

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          setError('Account created but profile setup failed.');
        } else {
          console.log('✅ Profile created successfully!');
        }
      }
    } catch (err: any) {
      console.error('💥 Registration error:', err);
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;

      console.log('✅ Signed out successfully');
      setUser(null);
    } catch (err: any) {
      console.error('❌ Sign out error:', err);
      setError(err.message || 'Sign out failed');
      throw err;
    }
  };

  const clearError = () => {
    console.log('🧹 Clearing errors');
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mr.sk