import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const userEmail = user?.email?.toLowerCase().trim() || '';
  const userRole = (user as any)?.role?.toLowerCase().trim() || '';

  // ================================================
  // FULL ACCESS EMAILS
  // ================================================
  const FULL_ACCESS_EMAILS = [
    'mpadmin605@gmail.com',
    'mpwonar605@gmail.com',
    'mpmanager605@gmail.com',
    'mplab605@gmail.com',
    'mpdyesincharge605@gmail.com',
  ];

  // ================================================
  // RESTRICTED ACCESS EMAILS
  // ================================================
  const RESTRICTED_ACCESS_EMAILS = [
    'mpsupervisor605@gmail.com',
    'mpsample605@gmail.com',
  ];

  // ================================================
  // CHECK ACCESS PERMISSIONS
  // ================================================
  const isFullAccessUser =
    userRole === 'admin' ||
    userRole === 'manager' ||
    FULL_ACCESS_EMAILS.includes(userEmail);

  const isRestrictedUser =
    !isFullAccessUser &&
    (userRole === 'user' || RESTRICTED_ACCESS_EMAILS.includes(userEmail));

  const showFullTabs = isFullAccessUser;
  const showRestrictedTabs = isRestrictedUser;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          Colors[colorScheme === 'dark' ? 'dark' : 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
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
          href: showFullTabs || showRestrictedTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      {/* 2. ADD CHEMICAL (FULL ACCESS ONLY) */}
      <Tabs.Screen
        name="want"
        options={{
          title: 'Add Chemical',
          href: showFullTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="plus.app" color={color} />
          ),
        }}
      />

      {/* 3. CHEMICALS (FULL + RESTRICTED) */}
      <Tabs.Screen
        name="want-view"
        options={{
          title: 'Chemicals',
          href: showFullTabs || showRestrictedTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="flask" size={26} color={color} />
          ),
        }}
      />

      {/* 4. STOCK OUT (FULL + RESTRICTED) */}
      <Tabs.Screen
        name="stockOut"
        options={{
          title: 'Stock Out',
          href: showFullTabs || showRestrictedTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="tray-arrow-up" size={26} color={color} />
          ),
        }}
      />

      {/* 5. STOCK ENTRY (FULL ACCESS ONLY) */}
      <Tabs.Screen
        name="stockInScreen"
        options={{
          title: 'Stock Entry',
          href: showFullTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="tray-arrow-down" size={26} color={color} />
          ),
        }}
      />

      {/* 6. DETAILS (FULL ACCESS ONLY) */}
      <Tabs.Screen
        name="chemicals"
        options={{
          title: 'Details',
          href: showFullTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="file-document-outline"
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 7. ALERTS (FULL + RESTRICTED) */}
      <Tabs.Screen
        name="alert"
        options={{
          title: 'Alerts',
          href: showFullTabs || showRestrictedTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="bell.fill" color={color} />
          ),
        }}
      />

      {/* 8. PROFILE (FULL + RESTRICTED) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: showFullTabs || showRestrictedTabs ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.circle.fill" color={color} />
          ),
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