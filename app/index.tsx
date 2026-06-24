/**
 * Index Screen - Auth Redirect
 * Shows splash while checking auth state
 * Redirects to login or dashboard
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect based on auth state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User logged in → dashboard
        router.replace('/(tabs)/');
      } else {
        // User not logged in → login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading screen
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2E7D32" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
