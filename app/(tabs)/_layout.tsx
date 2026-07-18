// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="want" 
        options={{ 
          title: 'Add Chemical', 
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="plus.app" color={color} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="want-view" 
        options={{ 
          title: 'All View', 
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="qr-demo" 
        options={{ 
          title: 'Stock Entry', 
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="camera.viewfinder" color={color} />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="person.circle.fill" color={color} />
          ) 
        }} 
      />
      
      
     
      <Tabs.Screen 
        name="alert" 
        options={{ 
          title: 'Alerts',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          )
        }} 
      />
      
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

// mr.sk
