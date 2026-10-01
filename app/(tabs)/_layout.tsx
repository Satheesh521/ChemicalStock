import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; // Ungal Supabase import path
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import HapticTab from '../../components/haptic-tab';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setRole(data.role?.toLowerCase());
          }
        } catch (e) {
          console.error('Error fetching role:', e);
        } finally {
          setRoleLoading(false);
        }
      } else {
        setRoleLoading(false);
      }
    }
    fetchRole();
  }, [user]);

  if (authLoading || roleLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Database Role Based Conditions
  const isFullAccess = ['admin', 'lab', 'dyesincharge'].includes(role || '');
  const isViewOnly = ['owner', 'manager'].includes(role || '');
  const isRestricted = ['supervisor', 'sample'].includes(role || '');

  const canSeeAllScreens = isFullAccess || isViewOnly;
  const canSeeBasicScreens = canSeeAllScreens || isRestricted;

  // Safe Icon Renderer Function
  const renderIcon = (name: React.ComponentProps<typeof MaterialCommunityIcons>['name'], color: string) => {
    if (!MaterialCommunityIcons) return null;
    const validIconNames: Array<React.ComponentProps<typeof MaterialCommunityIcons>['name']> = [
      'home', 'plus-box', 'flask', 'tray-arrow-up', 'tray-arrow-down',
      'file-document-outline', 'bell', 'account-circle'
    ];
    if (!validIconNames.includes(name)) {
      return <MaterialCommunityIcons name="home" size={26} color={color} />;
    }
    return <MaterialCommunityIcons name={name} size={26} color={color} />;
  };

  const TabBarButton = typeof HapticTab === 'function' ? HapticTab : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          Colors[colorScheme === 'dark' ? 'dark' : 'light'].tint,
        headerShown: false,
        tabBarButton: TabBarButton,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: canSeeBasicScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('home', color),
        }}
      />

      {/* 2. ADD CHEMICAL */}
      <Tabs.Screen
        name="want"
        options={{
          title: 'Add Chemical',
          href: canSeeAllScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('plus-box', color),
        }}
      />

      {/* 3. CHEMICALS */}
      <Tabs.Screen
        name="want-view"
        options={{
          title: 'Chemicals',
          href: canSeeBasicScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('flask', color),
        }}
      />

      {/* 4. STOCK OUT */}
      <Tabs.Screen
        name="stockOut"
        options={{
          title: 'Stock Out',
          href: canSeeBasicScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('tray-arrow-up', color),
        }}
      />

      {/* 5. STOCK ENTRY */}
      <Tabs.Screen
        name="stockInScreen"
        options={{
          title: 'Stock Entry',
          href: canSeeAllScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('tray-arrow-down', color),
        }}
      />

      {/* 6. DETAILS */}
      <Tabs.Screen
        name="chemicals"
        options={{
          title: 'Details',
          href: canSeeAllScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('file-document-outline', color),
        }}
      />

      {/* 7. ALERTS */}
      <Tabs.Screen
        name="alert"
        options={{
          title: 'Alerts',
          href: canSeeBasicScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('bell', color),
        }}
      />

      {/* 8. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: canSeeBasicScreens ? undefined : null,
          tabBarIcon: ({ color }) => renderIcon('account-circle', color),
        }}
      />

      {/* UNUSED SCREEN */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}