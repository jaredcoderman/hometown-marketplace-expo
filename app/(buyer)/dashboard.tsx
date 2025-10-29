import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { SellerWithDistance } from '@/types';
import { getNearbySellers } from '@/services/seller.service';
import { SellerCard } from '@/components/sellers/seller-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function BuyerDashboard() {
  const { location, radiusMiles, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSellers();
  }, [location, radiusMiles]);

  const loadSellers = async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      const nearbySellers = await getNearbySellers(location, radiusMiles);
      setSellers(nearbySellers);
    } catch (error: any) {
      console.error('Error loading sellers:', error);
      Alert.alert('Error', 'Failed to load nearby sellers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSellers();
  };

  const handleSellerPress = (sellerId: string) => {
    router.push(`/(buyer)/sellers/${sellerId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Finding nearby sellers..." />;
  }

  if (!location) {
    return (
      <EmptyState
        icon="📍"
        title="Location Not Set"
        description="Please set your location to find nearby sellers"
        actionLabel="Set Location"
        onAction={() => router.push('/(auth)/onboarding')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}! 👋</Text>
          <Text style={styles.location}>
            📍 {location.city}, {location.state}
          </Text>
        </View>
        <Text style={styles.radius}>Within {radiusMiles} miles</Text>
      </View>

      {sellers.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No Sellers Found"
          description={`No sellers found within ${radiusMiles} miles of your location. Try increasing your search radius.`}
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={sellers}
          renderItem={({ item }) => (
            <SellerCard
              seller={item}
              onPress={() => handleSellerPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  radius: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
});

