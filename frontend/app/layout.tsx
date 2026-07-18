import React, { createContext, useContext, useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User, authToken: string, rememberMe: boolean = false) => {
    try {
      setToken(authToken);
      setUser(userData);
      
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      if (rememberMe) {
        await AsyncStorage.setItem('remember_me', 'true');
      }
    } catch (error) {
      console.error('Error storing auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      
      await AsyncStorage.multiRemove(['auth_token', 'user_data', 'remember_me']);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSupervisor: user?.role === 'supervisor',
    isSuperAdmin: user?.role === 'super_admin',
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#49d137" />
        <ThemedText style={{ marginTop: 16 }}>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'supervisor' | 'super_admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin, isSupervisor, isSuperAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (requiredRole) {
    switch (requiredRole) {
      case 'admin':
        if (!isAdmin) return <Redirect href="/dashboard" />;
        break;
      case 'supervisor':
        if (!isSupervisor && !isAdmin) return <Redirect href="/dashboard" />;
        break;
      case 'super_admin':
        if (!isSuperAdmin) return <Redirect href="/dashboard" />;
        break;
    }
  }

  return <>{children}</>;
}
