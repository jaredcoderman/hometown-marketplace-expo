import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByBuyer } from '@/services/request.service';
import { ProductRequest } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function BuyerRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const data = await getRequestsByBuyer(user.id);
      // Pending first, then most recent
      const sorted = [...data].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      setRequests(sorted);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return <LoadingSpinner fullScreen message="Loading requests..." />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: ProductRequest }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={styles.statusRow}>
          <Ionicons name={item.status === 'pending' ? 'time-outline' : item.status === 'approved' ? 'checkmark-circle' : 'close-circle'} size={14} color={getStatusColor(item.status)} style={{ marginRight: 6 }} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.sellerText}>Seller: {item.sellerId}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.metaText}>Qty: {item.quantity}</Text>
        <Text style={styles.total}>{formatPrice(item.totalPrice)}</Text>
      </View>
      {item.message ? <Text style={styles.message} numberOfLines={2}>{item.message}</Text> : null}
      <Text style={styles.date}>{item.createdAt.toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <EmptyState title="No Requests Yet" description="Your product requests will appear here." />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700' },
  sellerText: { marginTop: 4, fontSize: 12, color: Colors.textSecondary },
  metaText: { marginTop: 6, fontSize: 12, color: Colors.textSecondary },
  total: { marginTop: 6, fontSize: 16, fontWeight: '700', color: Colors.primary },
  message: { marginTop: 8, fontSize: 13, color: Colors.text },
  date: { marginTop: 8, fontSize: 11, color: Colors.textSecondary },
});


