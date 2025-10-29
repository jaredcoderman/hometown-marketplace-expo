import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getProductsBySeller } from '@/services/product.service';
import { getSellerByUserId } from '@/services/seller.service';
import { Product, Seller } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerData();
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Dashboard focused, reloading data...');
      loadSellerData();
    }, [user])
  );

  const loadSellerData = async () => {
    if (!user) return;

    try {
      const sellerData = await getSellerByUserId(user.id);
      
      if (sellerData) {
        setSeller(sellerData);
        const productsData = await getProductsBySeller(sellerData.id);
        setProducts(productsData);
      }
    } catch (error: any) {
      console.error('Error loading seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProfile = () => {
    console.log('Setup Profile button clicked - navigating to profile page');
    router.push('/(seller)/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  if (!seller) {
    return (
      <EmptyState
        icon="🏪"
        title="Setup Your Seller Profile"
        description="Create your seller profile to start listing products and connect with local buyers."
        actionLabel="Setup Profile"
        onAction={handleSetupProfile}
      />
    );
  }

  const inStockProducts = products.filter((p) => p.inStock).length;
  const outOfStockProducts = products.filter((p) => !p.inStock).length;

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back! 👋</Text>
        <Text style={styles.businessName}>{seller.businessName}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.successText]}>
            {inStockProducts}
          </Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.warningText]}>
            {outOfStockProducts}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/products/create')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Product</Text>
            <Text style={styles.actionDescription}>
              List a new product for sale
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/products')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="cube-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Products</Text>
            <Text style={styles.actionDescription}>
              View and edit your products
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/profile')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="settings-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Edit Profile</Text>
            <Text style={styles.actionDescription}>
              Update your seller information
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Products */}
      {products.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Products</Text>
          {products.slice(0, 3).map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/(seller)/products/${product.id}`)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  product.inStock ? styles.inStockBadge : styles.outOfStockBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    product.inStock ? styles.inStockText : styles.outOfStockText,
                  ]}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  successText: {
    color: Colors.success,
  },
  warningText: {
    color: Colors.warning,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionArrow: {
    fontSize: 28,
    color: Colors.disabled,
  },
  productCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inStockBadge: {
    backgroundColor: '#E8F5E9',
  },
  outOfStockBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStockText: {
    color: Colors.success,
  },
  outOfStockText: {
    color: Colors.error,
  },
});

