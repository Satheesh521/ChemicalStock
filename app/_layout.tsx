// app/_layout.tsx

import * as Crypto from 'expo-crypto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { ChemicalStockErrorBoundary } from '../components/ChemicalStockErrorBoundary';
import { AuthProvider, useAuth } from '../context/AuthContext';
import '../lib/supabase';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    randomUUID: () => Crypto.randomUUID(),
  };
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {

      router.replace('/login');
    } else if (user && inAuthGroup) {

      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ChemicalStockErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ChemicalStockErrorBoundary>
  );
}