// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import type { WantItem } from '../../components/want-form';
import { Colors } from '../../constants/theme';
import type { StockOutItem } from '../../context/want-context-supabase';
import { useWant } from '../../context/want-context-supabase';
import { useColorScheme } from '../../hooks/use-color-scheme';

// ✅ Separate component — Hook இங்க use பண்ணலாம்
function AlertTabIcon({ color }: { color: string }) {
  const { items, stockOutItems } = useWant(); // ✅ CORRECT — proper component

  const hasLowStock = items.some((chemical: WantItem) => {
    const totalStock = parseFloat(chemical.totalStock as string) || 0;

    const totalStockOut = stockOutItems
      .filter((item: StockOutItem) =>
        item.chemicalName.toLowerCase() === chemical.chemicalName.toLowerCase()
      )
      .reduce((sum: number, item: StockOutItem) => {
        const stockValue = parseFloat(item.stockValue as string) || 0;
        const unit = item.stockUnit?.toLowerCase() || 'kg';
        if (unit === 'kg') return sum + stockValue;
        if (unit === 'g') return sum + stockValue / 1000;
        if (unit === 'mg') return sum + stockValue / 1000000;
        return sum;
      }, 0);

    const remainingStock = totalStock - totalStockOut;
    return !isNaN(remainingStock) && remainingStock <= 25;
  });

  const iconColor = hasLowStock ? '#ff0000' : color;
  return <IconSymbol size={28} name="bell.fill" color={iconColor} />;
}

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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="want"
        options={{
          title: 'Add Chemical',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.app" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="want-view"
        options={{
          title: 'All View',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stock-out"
        options={{
          title: 'Stock Out',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="arrow.down.circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-demo"
        options={{
          title: 'Stock Entry',
          tabBarIcon: () => (
            <IconSymbol size={28} name="camera.viewfinder" color="#ffffff" />
          ),
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="stock" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="profile" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chemicals"
        options={{
          title: 'Chemicals',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chemicals" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alert"
        options={{
          title: 'Alert',
          tabBarIcon: ({ color }) => (
            <AlertTabIcon color={color} /> // ✅ Proper component
          ),
        }}
      />

      {/* Explore tab hide */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}