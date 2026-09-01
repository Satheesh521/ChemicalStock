import { supabase } from '@/lib/supabase';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
  signIn: (email: string, password: string) => Promise<User | undefined>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatUser = (sessionUser: any, profile: any = null): User => {
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      name: profile?.name || sessionUser.user_metadata?.full_name || null,
      role: profile?.role || 'user',
      created_at: profile?.created_at || new Date().toISOString(),
      updated_at: profile?.updated_at || new Date().toISOString(),
    };
  };

  // Helper function to fetch profile and merge user data
  const getUserWithProfile = async (sessionUser: any): Promise<User> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      return formatUser(sessionUser, profile);
    } catch {
      return formatUser(sessionUser);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const fullUser = await getUserWithProfile(session.user);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const fullUser = await getUserWithProfile(session.user);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const parseErrorMessage = (err: any): string => {
    if (!err) return 'An unknown error occurred';
    if (typeof err === 'string') return err;
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Authentication failed';
    }
  };

  const signIn = async (email: string, password: string): Promise<User | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const cleanMsg = parseErrorMessage(authError);
        setError(cleanMsg);
        throw new Error(cleanMsg);
      }

      if (data.user) {
        const fullUser = await getUserWithProfile(data.user);
        setUser(fullUser);
        return fullUser;
      }
    } catch (err: any) {
      const cleanMsg = parseErrorMessage(err);
      setError(cleanMsg);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (authError) {
        const cleanMsg = parseErrorMessage(authError);
        setError(cleanMsg);
        throw new Error(cleanMsg);
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([
          {
            id: authData.user.id,
            email: email,
            name: name || null,
            provider: 'email',
            role: 'user',
            updated_at: new Date().toISOString(),
          },
        ] as any);

        if (profileError) {
          console.warn('Profile sync notice:', profileError.message);
        }
      }
    } catch (err: any) {
      const cleanMsg = parseErrorMessage(err);
      setError(cleanMsg);
      throw new Error(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      setError(parseErrorMessage(err));
      throw err;
    }
  };

  const clearError = () => setError(null);

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