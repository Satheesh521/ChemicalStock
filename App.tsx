// App.tsx
/**
 * Application Entry Point
 * Initializes app with Navigation, Supabase, and Auth Context
 * 
 * REQUIRED PACKAGES:
 * - react-native
 * - @react-navigation/native
 * - @react-navigation/stack
 * - @supabase/supabase-js
 * - react-native-safe-area-context
 */

import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChemicalStockErrorBoundary } from './components/ChemicalStockErrorBoundary'; // ✅ Added missing import
import { debugEnvironment, validateEnvironment } from './config/envConfig';
import { AuthProvider } from './context/AuthContext';
import { supabase } from './lib/supabase';
import AppNavigator from './navigation/AppNavigator';

// ===========================
// APP COMPONENT
// ===========================
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Chemical Stock App...');
        
        // Validate environment variables
        if (!validateEnvironment()) {
          throw new Error('Environment validation failed. Check .env file.');
        }

        // Debug environment (development only)
        if (__DEV__) {
          debugEnvironment();
        }

        // ✅ Supabase initialization and session check (Firebase code removed)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('✅ Supabase initialized', session ? 'User logged in' : 'No active session');
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Still show app to allow error recovery
      }
    };

    initializeApp();
  }, []);

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <SafeAreaProvider style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="auto" />
        {initError ? (
          <>
            <Text style={{ fontSize: 16, color: 'red', textAlign: 'center' }}>
              🚨 Initialization Failed
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 }}>
              {initError}
            </Text>
            <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 }}>
              Please restart the app
            </Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16, color: '#333', textAlign: 'center' }}>
              Chemical Stock
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 }}>
              Initializing...
            </Text>
          </>
        )}
      </SafeAreaProvider>
    );
  }

  // Main app with error boundary
  return (
    <ChemicalStockErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ChemicalStockErrorBoundary>
  );
};

export default App;