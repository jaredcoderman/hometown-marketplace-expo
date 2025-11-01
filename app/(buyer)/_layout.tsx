import { HapticTab } from '@/components/haptic-tab';
import AppColors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { subscribeToBuyerRequests } from '@/services/request.service';
import { addPendingNotification, getPendingNotificationIds } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BuyerLayout() {
  function RequestsIconWithBadge({ color }: { color: string }) {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    const previousStatusesRef = useRef<Record<string, string>>({});
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
      if (!user?.id) {
        setCount(0);
        return;
      }

      // Subscribe to real-time updates
      const unsubscribe = subscribeToBuyerRequests(user.id, async (requests) => {
        const previousStatuses = previousStatusesRef.current;
        const isFirstLoad = isFirstLoadRef.current;
        
        // On first load, just store current statuses and don't show notifications
        if (isFirstLoad) {
          previousStatusesRef.current = Object.fromEntries(
            requests.map((r) => [r.id, r.status])
          );
          isFirstLoadRef.current = false;
          
          // Get existing pending notifications count
          const pendingIds = await getPendingNotificationIds(user.id);
          setCount(pendingIds.size);
          return;
        }

        // Detect status changes from pending to approved/rejected
        for (const req of requests) {
          const prevStatus = previousStatuses[req.id];
          
          // If status changed from pending to approved/rejected, add to pending notifications
          if (
            prevStatus === 'pending' &&
            (req.status === 'approved' || req.status === 'rejected')
          ) {
            await addPendingNotification(user.id, req.id);
          }
        }

        // Update previous statuses
        previousStatusesRef.current = Object.fromEntries(
          requests.map((r) => [r.id, r.status])
        );

        // Get current pending notifications count
        const pendingIds = await getPendingNotificationIds(user.id);
        setCount(pendingIds.size);
      });

      return () => unsubscribe();
    }, [user?.id]);

    return (
      <View style={{ width: 26, height: 26 }}>
        <Ionicons name={count > 0 ? 'notifications' : 'notifications-outline'} size={22} color={color} />
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
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </View>
    );
  }

  function ViewModeToggle() {
    const { mode, setMode } = useViewMode();
    const { user } = useAuth();

    // Only show toggle for seller accounts
    if (user?.userType !== 'seller') return null;

    const handleSwitchToSeller = async () => {
      if (mode === 'seller') return; // Already in seller mode
      await setMode('seller');
      router.replace('/(seller)/dashboard');
    };

    const handleSwitchToBuyer = async () => {
      if (mode === 'buyer') return; // Already in buyer mode
      await setMode('buyer');
      router.replace('/(buyer)/dashboard');
    };

    return (
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'seller' && styles.toggleOptionActive]}
          onPress={handleSwitchToSeller}
        >
          <Ionicons 
            name={mode === 'seller' ? 'storefront' : 'storefront-outline'} 
            size={16} 
            color={mode === 'seller' ? '#FFF' : AppColors.textSecondary} 
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.toggleText, mode === 'seller' && styles.toggleTextActive]}>
            Sell
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'buyer' && styles.toggleOptionActive]}
          onPress={handleSwitchToBuyer}
        >
          <Ionicons 
            name={mode === 'buyer' ? 'cart' : 'cart-outline'} 
            size={16} 
            color={mode === 'buyer' ? '#FFF' : AppColors.textSecondary} 
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.toggleText, mode === 'buyer' && styles.toggleTextActive]}>
            Buy
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        headerShown: true,
        headerRight: () => <ViewModeToggle />,
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

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 8,
    padding: 2,
    marginRight: 16,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: AppColors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
});

