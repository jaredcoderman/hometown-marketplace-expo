import { SellerCard } from '@/components/sellers/seller-card';
import { EmptyState } from '@/components/ui/empty-state';
import { prefetchImages } from '@/components/ui/lazy-image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/contexts/ToastContext';
import { getNearbySellers, getSellerByUserId } from '@/services/seller.service';
import { SellerWithDistance } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

export default function BuyerDashboard() {
  const { location, radiusMiles, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();
  const [brandQuery, setBrandQuery] = useState('');

  // Simpler mobile-friendly behavior: show at top, fade/collapse after threshold
  const HEADER_MAX = 48; // base height for location/radius row
  const SEARCH_MAX = 52; // base height for search bar
  const THRESHOLD_PX = 80; // ~10% of a typical viewport, tweak as needed

  const visibility = React.useRef(new Animated.Value(1)).current; // 1=visible, 0=hidden
  const targetRef = React.useRef(1);

  const animateTo = (value: number) => {
    if (targetRef.current === value) return;
    targetRef.current = value;
    Animated.timing(visibility, {
      toValue: value,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const headerHeight = visibility.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_MAX] });
  const headerOpacity = visibility;
  const headerPadding = visibility.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });
  const headerBorder = visibility;

  const searchHeight = visibility.interpolate({ inputRange: [0, 1], outputRange: [0, SEARCH_MAX] });
  const searchOpacity = visibility;
  const searchPadding = visibility.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const searchBorder = visibility;

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
      
      // Filter out the seller's own business if they're in buyer mode
      let filteredSellers = nearbySellers;
      if (user?.userType === 'seller') {
        const ownSeller = await getSellerByUserId(user.id);
        if (ownSeller) {
          filteredSellers = nearbySellers.filter((s) => s.id !== ownSeller.id);
        }
      }
      
      setSellers(filteredSellers);
      // Prefetch seller avatars
      const avatarUrls = filteredSellers.map((s) => s.avatar).filter(Boolean) as string[];
      if (avatarUrls.length) prefetchImages(avatarUrls);
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
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity, overflow: 'hidden', paddingVertical: headerPadding as any, borderBottomWidth: headerBorder as any }]}>
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.location}>{location.city}, {location.state}</Text>
        </View>
        <View style={styles.radiusChip}>
          <Text style={styles.radiusText}>Within {radiusMiles} miles</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.searchBarContainer, { height: searchHeight, opacity: searchOpacity, overflow: 'hidden', paddingTop: searchPadding as any, paddingBottom: searchPadding as any, borderBottomWidth: searchBorder as any }]} >
        <TextInput
          style={styles.searchBar}
          placeholder="Search brands..."
          value={brandQuery}
          onChangeText={setBrandQuery}
          autoCapitalize="none"
        />
      </Animated.View>

      {filteredSellers.length === 0 ? (
        <EmptyState
          iconNode={undefined}
          title="No Sellers Found"
          description={brandQuery.trim() ? `No brands match "${brandQuery}".` : `No sellers found within ${radiusMiles} miles of your location. Try increasing your search radius.`}
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <Animated.FlatList
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
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            if (y > THRESHOLD_PX) animateTo(0); else animateTo(1);
          }}
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

