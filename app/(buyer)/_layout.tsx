import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function BuyerLayout() {
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
          title: 'Nearby Sellers',
          tabBarIcon: () => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: () => (
            <Text style={{ fontSize: 24 }}>🔍</Text>
          ),
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

