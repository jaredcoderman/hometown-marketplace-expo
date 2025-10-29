import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsBySeller } from '@/services/request.service';
import { getSellerByUserId } from '@/services/seller.service';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

function RequestsIconWithBadge({ color }: { color: string }) {
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
    <View style={{ width: 26, height: 26 }}>
      <Ionicons name="clipboard-outline" size={22} color={color} />
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            top: -2,
            backgroundColor: AppColors.primary,
            borderRadius: 8,
            minWidth: 14,
            height: 14,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 2,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
        </View>
      )}
    </View>
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Products',
          href: '/products',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={22} color={color} />
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

