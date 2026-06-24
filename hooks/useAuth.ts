import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface AuthState {
  user: any;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check for existing session on app start
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthState({ user: session.user, loading: false });
      } else {
        setAuthState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({ user: null, loading: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
        setAuthState({ user: null, loading: false });
        return { success: false, error: error.message };
      }

      // Check user profile for role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single() as any;

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      const userWithRole = {
        ...data.user,
        role: profile?.role || 'viewer',
      };

      setAuthState({ user: userWithRole, loading: false });
      return { success: true, user: userWithRole };
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
      setAuthState({ user: null, loading: false });
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({ user: null, loading: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
    checkUser,
  };
}
