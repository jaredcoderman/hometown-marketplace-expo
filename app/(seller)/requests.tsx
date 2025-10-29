import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getProduct, updateProduct } from '@/services/product.service';
import { getRequestsBySeller, updateRequestStatus } from '@/services/request.service';
import { getSellerByUserId } from '@/services/seller.service';
import { ProductRequest } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'approve' | 'reject' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const { show } = useToast();

  // Clear selection after modal fully closes to avoid content flicker
  useEffect(() => {
    if (!confirmVisible) {
      const t = setTimeout(() => {
        setSelectedRequest(null);
        setConfirmKind(null);
      }, 220);
      return () => clearTimeout(t);
    }
  }, [confirmVisible]);

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [user])
  );

  const loadRequests = async () => {
    if (!user) return;

    try {
      const seller = await getSellerByUserId(user.id);
      if (seller) {
        const requestsData = await getRequestsBySeller(seller.id);
        setRequests(requestsData);
      }
    } catch (error: any) {
      console.error('Error loading requests:', error);
      show('Failed to load requests', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const doApprove = async (request: ProductRequest) => {
    setProcessingId(request.id);
    try {
      // Update request status
      await updateRequestStatus(request.id, 'approved');

      // Get current product and update quantity
      const product = await getProduct(request.productId);
      if (product.quantity !== undefined) {
        const newQuantity = Math.max(0, product.quantity - request.quantity);
        await updateProduct(request.productId, {
          quantity: newQuantity,
          inStock: newQuantity > 0,
        });
      }

      show('Request approved! Quantity updated.', 'success');
      loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      show('Failed to approve request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const doReject = async (request: ProductRequest) => {
    setProcessingId(request.id);
    try {
      await updateRequestStatus(request.id, 'rejected');
      show('Request rejected', 'info');
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      show('Failed to reject request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIconName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const renderRequest = ({ item }: { item: ProductRequest }) => {
    const isExpanded = expandedId === item.id;
    const isProcessing = processingId === item.id;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.buyerName}>{item.buyerName}</Text>
            <Text style={styles.productName}>{item.productName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusRow}>
              <Ionicons name={getStatusIconName(item.status) as any} size={14} color={getStatusColor(item.status)} style={{ marginRight: 6 }} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {item.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Message from buyer:</Text>
              <Text style={styles.messageText}>
                {item.message || 'No additional message'}
              </Text>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.contactLabel}>Contact:</Text>
              <Text style={styles.contactText}>{item.buyerEmail}</Text>
            </View>

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <Button
                  title="Approve"
                  onPress={() => { setSelectedRequest(item); setConfirmKind('approve'); setConfirmVisible(true); }}
                  loading={isProcessing}
                  variant="primary"
                  style={styles.actionButton}
                />
                <Button
                  title="Reject"
                  onPress={() => { setSelectedRequest(item); setConfirmKind('reject'); setConfirmVisible(true); }}
                  loading={isProcessing}
                  variant="danger"
                  style={styles.actionButton}
                />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading requests..." />;
  }

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
        return [...pendingRequests, ...approvedRequests, ...rejectedRequests];
    }
  };

  return (
    <>
    <View style={styles.container}>
      {requests.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Requests Yet"
          description="When buyers request your products, they'll appear here."
        />
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
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        </>
      )}
    </View>
      <ConfirmModal
        visible={confirmVisible}
        title={confirmKind === 'approve' ? 'Approve Request' : 'Reject Request'}
        message={
          confirmKind === 'approve'
            ? `Approve ${selectedRequest?.buyerName}'s request for ${selectedRequest?.quantity}× ${selectedRequest?.productName}? This will reduce your available quantity.`
            : `Reject the request from ${selectedRequest?.buyerName}?`
        }
        confirmLabel={confirmKind === 'approve' ? 'Approve' : 'Reject'}
        cancelLabel={'Cancel'}
        onCancel={() => { setConfirmVisible(false); }}
        onConfirm={() => {
          if (!selectedRequest) return;
          setConfirmVisible(false);
          if (confirmKind === 'approve') doApprove(selectedRequest); else doReject(selectedRequest);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterChip: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageSection: {
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

