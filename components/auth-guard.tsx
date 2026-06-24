import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      Alert.alert(
        'Authentication Required',
        'Please login to access the app',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  }, [user, loading, router]);

  if (loading) {
    return null; // or show loading spinner
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
