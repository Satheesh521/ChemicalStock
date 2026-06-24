import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import type { Database } from '../lib/supabase';

export type User = Database['public']['Tables']['profiles']['Row'];

export interface AuthState {
  user: User | null;
  loading: boolean;
  session: any | null;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Authentication service
export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        
        // User-friendly error messages
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please verify your email before signing in.';
            break;
          default:
            errorMessage = 'Login failed. Please check your credentials and try again.';
        }
        
        return { success: false, error: errorMessage };
      }

      // Get user profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        const userWithProfile: User = {
          ...data.user,
          ...profile,
        };

        return { success: true, user: userWithProfile };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, fullName: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // First create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        let errorMessage = error.message;
        
        // User-friendly error messages
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.message.includes('valid email')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: fullName,
            role: 'user', // Default role
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { success: false, error: 'Account created but profile setup failed.' };
        }

        const userWithProfile: User = {
          ...data.user,
          email: data.user.email!,
          name: fullName,
          role: 'user',
        };

        return { success: true, user: userWithProfile };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // Sign out
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { success: false, error: 'Failed to sign out. Please try again.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Network error occurred.' };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<{ user: User | null; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        return { user: null, error: 'Failed to get session.' };
      }

      if (!session?.user) {
        return { user: null };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return { user: session.user, error: 'Failed to load user profile.' };
      }

      const userWithProfile: User = {
        ...session.user,
        ...profile,
      };

      return { user: userWithProfile };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: 'Network error occurred.' };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('not found')) {
          errorMessage = 'No account found with this email address.';
        } else {
          errorMessage = 'Failed to send reset email. Please try again.';
        }
        
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Get user profile when auth state changes
        this.getCurrentUser().then(({ user }) => {
          callback(user);
        });
      } else {
        callback(null);
      }
    });
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long.' };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number.' };
    }
    
    return { isValid: true };
  }
}
