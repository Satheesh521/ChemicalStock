// components/SafeNavigatorWrapper.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';

interface SafeNavigatorWrapperProps {
  children?: React.ReactNode;
}

export const SafeNavigatorWrapper: React.FC<SafeNavigatorWrapperProps> = ({ children }) => {
  const [navigatorError, setNavigatorError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      console.log('🚀 Initializing Chemical Stock Navigator...');
      
      // Simulate navigator initialization
      const timer = setTimeout(() => {
        setIsLoading(false);
        console.log('✅ Navigator initialized successfully');
      }, 1000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('❌ Navigator initialization failed:', error);
      setNavigatorError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  if (navigatorError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#f8f9fa'
      }}>
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 10,
          maxWidth: '90%'
        }}>
          <Text style={{ 
            fontSize: 18, 
            color: '#dc3545', 
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10 
          }}>
            🚨 Navigation Error
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: '#666', 
            textAlign: 'center',
            marginBottom: 15 
          }}>
            {navigatorError}
          </Text>

          <Text style={{ 
            fontSize: 12, 
            color: '#999', 
            textAlign: 'center' 
          }}>
            Chemical Stock - Navigation Failed
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ 
          fontSize: 16, 
          color: '#666', 
          textAlign: 'center',
          marginTop: 10 
        }}>
          Loading Chemical Stock...
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
};
