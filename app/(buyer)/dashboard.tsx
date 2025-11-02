import { SellerCard } from '@/components/sellers/seller-card';
import { EmptyState } from '@/components/ui/empty-state';
import { prefetchImages } from '@/components/ui/lazy-image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/contexts/ToastContext';
import { getNearbySellers, getSellerByUserId } from '@/services/seller.service';
import { SellerWithDistance } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function BuyerDashboard() {
  const { location, radiusMiles, getCurrentLocation, setRadiusMiles } = useLocation();
  const { user } = useAuth();
  const [allSellers, setAllSellers] = useState<SellerWithDistance[]>([]); // All sellers within 50 miles
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();
  const [brandQuery, setBrandQuery] = useState('');
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [tempRadius, setTempRadius] = useState(15);

  // Filter sellers by current radius
  const sellers = useMemo(() => {
    return allSellers.filter((s) => s.distance <= radiusMiles);
  }, [allSellers, radiusMiles]);

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
  }, [location]);

  const loadSellers = async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      // Always fetch up to 50 miles to allow client-side filtering
      const nearbySellers = await getNearbySellers(location, 50);
      
      // Filter out the seller's own business if they're in buyer mode
      let filteredSellers = nearbySellers;
      if (user?.userType === 'seller') {
        const ownSeller = await getSellerByUserId(user.id);
        if (ownSeller) {
          filteredSellers = nearbySellers.filter((s) => s.id !== ownSeller.id);
        }
      }
      
      // Store all sellers (within 50 miles)
      setAllSellers(filteredSellers);
      
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

  const handleOpenRadiusModal = () => {
    setTempRadius(radiusMiles);
    setShowRadiusModal(true);
  };

  const handleCloseRadiusModal = () => {
    setShowRadiusModal(false);
  };

  const handleApplyRadius = () => {
    setRadiusMiles(tempRadius);
    setShowRadiusModal(false);
    show(`Search radius set to ${tempRadius} miles`, 'success');
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
        <TouchableOpacity 
          style={styles.radiusChip}
          onPress={handleOpenRadiusModal}
          activeOpacity={0.7}
        >
          <Text style={styles.radiusText}>Within {radiusMiles} miles</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
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

      {/* Radius Adjust Modal */}
      <Modal
        visible={showRadiusModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseRadiusModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Search Radius</Text>
              <TouchableOpacity onPress={handleCloseRadiusModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            {(() => {
              const count = allSellers.filter(s => s.distance <= tempRadius).length;
              return (
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderLabel}>
                    <Text style={styles.sliderValue}>{tempRadius} miles</Text>
                    <Text style={styles.sliderSubtext}>
                      {count} {count === 1 ? 'business' : 'businesses'} found
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={50}
                    step={5}
                    value={tempRadius}
                    onValueChange={setTempRadius}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor={Colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderMinMax}>5 mi</Text>
                    <Text style={styles.sliderMinMax}>50 mi</Text>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyRadius}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.primary + '15',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  sliderSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderMinMax: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

