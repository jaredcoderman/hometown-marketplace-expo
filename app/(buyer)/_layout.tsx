import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByBuyer } from '@/services/request.service';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function BuyerLayout() {
  function RequestsIconWithBadge({ color }: { color: string }) {
    const { user } = useAuth();
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      let cancelled = false;
      async function load() {
        try {
          if (!user) return;
          const all = await getRequestsByBuyer(user.id);
          const updated = all.filter(r => r.status === 'approved' || r.status === 'rejected').length;
          if (!cancelled) setCount(updated);
        } catch {}
      }
      load();
      const id = setInterval(load, 15000);
      return () => { cancelled = true; clearInterval(id); };
    }, [user]);
    return <Ionicons name={count > 0 ? 'notifications' : 'notifications-outline'} size={22} color={color} />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: AppColors.card,
          borderTopColor: AppColors.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Near Me',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <RequestsIconWithBadge color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sellers/[sellerId]"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="products/[productId]"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}

