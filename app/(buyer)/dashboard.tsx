import { SellerCard } from '@/components/sellers/seller-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/contexts/ToastContext';
import { getNearbySellers } from '@/services/seller.service';
import { SellerWithDistance } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function BuyerDashboard() {
  const { location, radiusMiles, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();

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
      show('Failed to load nearby sellers', 'error');
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
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.location}>{location.city}, {location.state}</Text>
        </View>
        <View style={styles.radiusChip}>
          <Text style={styles.radiusText}>Within {radiusMiles} miles</Text>
        </View>
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPin: {
    fontSize: 16,
    marginRight: 6,
  },
  location: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  radiusChip: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  radiusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
});

