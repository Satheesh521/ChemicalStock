// app/_layout.tsx
// Root Layout with Providers & Error Boundary

// ✅ STEP 1: All imports FIRST — no code in between
import * as Crypto from 'expo-crypto';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { ChemicalStockErrorBoundary } from '../components/ChemicalStockErrorBoundary';
import { AuthProvider } from '../context/AuthContext';
import '../lib/supabase';

// ✅ STEP 2: Polyfill code AFTER all imports
// Fixed: Use globalThis instead of global
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    randomUUID: () => Crypto.randomUUID(),
  };
}

// ✅ STEP 3: Component
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.log('🚀 Initializing Chemical Stock App...');
        setIsReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setIsReady(true);
      }
    };
    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ChemicalStockErrorBoundary>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ChemicalStockErrorBoundary>
  );
}
