import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { subscribeToBuyerRequests } from '@/services/request.service';
import { getSeller } from '@/services/seller.service';
import { ProductRequest } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { clearPendingNotifications } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BuyerRequestsScreen() {
  const { user } = useAuth();
  const { show } = useToast();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sellerNamesById, setSellerNamesById] = useState<Record<string, string>>({});
  const previousStatusesRef = useRef<Record<string, string>>({});

  // Clear notifications immediately when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Clear immediately - don't await to avoid delay
        clearPendingNotifications(user.id).catch(console.error);
      }
    }, [user?.id])
  );

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time listener
    const unsubscribe = subscribeToBuyerRequests(user.id, (updatedRequests) => {
      // Sort: pending first, then most recent
      const sorted = [...updatedRequests].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      // Check for status changes and show notifications
      const previousStatuses = previousStatusesRef.current;
      const isFirstLoad = Object.keys(previousStatuses).length === 0;
      
      if (!isFirstLoad) {
        sorted.forEach((req) => {
          const prevStatus = previousStatuses[req.id];
          if (prevStatus && prevStatus !== req.status && prevStatus === 'pending') {
            if (req.status === 'approved') {
              show(`Your request for "${req.productName}" has been approved!`, 'success');
            } else if (req.status === 'rejected') {
              show(`Your request for "${req.productName}" has been rejected.`, 'error');
            }
          }
        });
      }
      
      // Update previous statuses
      previousStatusesRef.current = Object.fromEntries(
        sorted.map((r) => [r.id, r.status])
      );

      setRequests(sorted);
      
      setLoading(false);
      setRefreshing(false);

      // Load seller names for display
      setSellerNamesById((prev) => {
        const uniqueSellerIds = Array.from(new Set(sorted.map((r) => r.sellerId)));
        uniqueSellerIds.forEach((id) => {
          if (prev[id]) return; // Already loaded, skip
          // Load asynchronously without blocking
          getSeller(id)
            .then((seller) => {
              setSellerNamesById((p) => (p[id] ? p : { ...p, [id]: seller.businessName }));
            })
            .catch(() => {
              setSellerNamesById((p) => (p[id] ? p : { ...p, [id]: 'Unknown Seller' }));
            });
        });
        return prev;
      });
    });

    return () => unsubscribe();
  }, [user?.id, show]);

  if (loading) return <LoadingSpinner fullScreen message="Loading requests..." />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'pending': return '#FFF9E6'; // Light yellow/amber
      case 'approved': return '#E8F5E9'; // Light green
      case 'rejected': return '#FFEBEE'; // Light red
      default: return '#F5F5F5';
    }
  };

  const renderItem = ({ item }: { item: ProductRequest }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
          <Ionicons name={item.status === 'pending' ? 'time-outline' : item.status === 'approved' ? 'checkmark-circle' : 'close-circle'} size={14} color={getStatusColor(item.status)} style={{ marginRight: 4 }} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.sellerText}>Seller: {sellerNamesById[item.sellerId] || item.sellerId}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.metaText}>Qty: {item.quantity}</Text>
        <Text style={styles.total}>{formatPrice(item.totalPrice)}</Text>
      </View>
      {item.message ? <Text style={styles.message} numberOfLines={2}>{item.message}</Text> : null}
      <Text style={styles.date}>{item.createdAt.toLocaleDateString()}</Text>
    </View>
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const getFiltered = () => {
    switch (filter) {
      case 'pending':
        return pendingRequests;
      case 'approved':
        return approvedRequests;
      case 'rejected':
        return rejectedRequests;
      default:
        return requests;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Reload seller names for displayed requests
    const uniqueSellerIds = Array.from(new Set(requests.map((r) => r.sellerId)));
    await Promise.all(
      uniqueSellerIds.map(async (id) => {
        try {
          const seller = await getSeller(id);
          setSellerNamesById((prev) => ({ ...prev, [id]: seller.businessName }));
        } catch {
          setSellerNamesById((prev) => ({ ...prev, [id]: 'Unknown Seller' }));
        }
      })
    );
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <EmptyState title="No Requests Yet" description="Your product requests will appear here." />
      ) : (
        <>
          {/* Filters */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All ({requests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
              onPress={() => setFilter('pending')}
            >
              <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pending ({pendingRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'approved' && styles.filterChipActive]}
              onPress={() => setFilter('approved')}
            >
              <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>Approved ({approvedRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'rejected' && styles.filterChipActive]}
              onPress={() => setFilter('rejected')}
            >
              <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>Rejected ({rejectedRequests.length})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getFiltered()}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh} 
              />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  sellerText: { marginTop: 4, fontSize: 12, color: Colors.textSecondary },
  metaText: { marginTop: 6, fontSize: 12, color: Colors.textSecondary },
  total: { marginTop: 6, fontSize: 16, fontWeight: '700', color: Colors.primary },
  message: { marginTop: 8, fontSize: 13, color: Colors.text },
  date: { marginTop: 8, fontSize: 11, color: Colors.textSecondary },
});


