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
    TextInput,
    View,
} from 'react-native';

export default function BuyerDashboard() {
  const { location, radiusMiles, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();
  const [brandQuery, setBrandQuery] = useState('');

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
        iconNode={undefined}
        title="Location Not Set"
        description="Please set your location to find nearby sellers"
        actionLabel="Set Location"
        onAction={() => router.push('/(auth)/onboarding')}
      />
    );
  }

  const filteredSellers = brandQuery.trim()
    ? sellers.filter((s) => s.businessName.toLowerCase().includes(brandQuery.trim().toLowerCase()))
    : sellers;

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

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search brands..."
          value={brandQuery}
          onChangeText={setBrandQuery}
          autoCapitalize="none"
        />
      </View>

      {filteredSellers.length === 0 ? (
        <EmptyState
          iconNode={undefined}
          title="No Sellers Found"
          description={brandQuery.trim() ? `No brands match "${brandQuery}".` : `No sellers found within ${radiusMiles} miles of your location. Try increasing your search radius.`}
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={filteredSellers}
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
  searchBarContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});

