import { ProductCard } from '@/components/products/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getProductsBySeller } from '@/services/product.service';
import { getSellerByUserId } from '@/services/seller.service';
import { Product } from '@/types';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProductsListScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  // Reload products when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Products screen focused, reloading...');
      loadProducts();
    }, [user])
  );

  const loadProducts = async () => {
    if (!user) return;

    try {
      const seller = await getSellerByUserId(user.id);
      if (seller) {
        const productsData = await getProductsBySeller(seller.id);
        setProducts(productsData);
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      window.alert('Failed to load products: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleProductPress = (productId: string) => {
    router.push(`/(seller)/products/${productId}`);
  };

  const handleAddProduct = () => {
    router.push('/(seller)/products/create');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleAddProduct} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Products Yet"
            description="Start listing products to sell to local buyers."
            actionLabel="Add Your First Product"
            onAction={handleAddProduct}
          />
        ) : (
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <ProductCard
                  product={item}
                  onPress={() => handleProductPress(item.id)}
                  showStatus
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
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
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  addButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

