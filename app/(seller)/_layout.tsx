import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsBySeller } from '@/services/request.service';
import { getSellerByUserId } from '@/services/seller.service';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

function RequestsIconWithBadge() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!user) return;
        const seller = await getSellerByUserId(user.id);
        if (!seller) return;
        const all = await getRequestsBySeller(seller.id);
        const pending = all.filter((r) => r.status === 'pending').length;
        if (!cancelled) setCount(pending);
      } catch {}
    }
    load();
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  return (
    <Text style={{ fontSize: 24 }}>
      {count > 0 ? '📋' : '📋'}
    </Text>
  );
}

export default function SellerLayout() {
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
          title: 'Dashboard',
          tabBarIcon: () => (
            <Text style={{ fontSize: 24 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Products',
          href: '/products',
          tabBarIcon: () => (
            <Text style={{ fontSize: 24 }}>📦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: () => <RequestsIconWithBadge />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      />
      {/* Hide sub-routes from tabs */}
      <Tabs.Screen
        name="products/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="products/[productId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

