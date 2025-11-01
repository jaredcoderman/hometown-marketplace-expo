import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function AdminLayout() {
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
          title: 'Admin',
          headerTitle: 'Admin Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{
          title: 'Suggestions',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(admin)/dashboard')}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.text} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bulb' : 'bulb-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bugs"
        options={{
          title: 'Bugs',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(admin)/dashboard')}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.text} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bug' : 'bug-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

