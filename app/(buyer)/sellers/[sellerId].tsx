import { ProductCard } from '@/components/products/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getProductsBySeller } from '@/services/product.service';
import { getSeller } from '@/services/seller.service';
import { Product, Seller } from '@/types';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function SellerDetailScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    if (!sellerId) return;

    try {
      const [sellerData, productsData] = await Promise.all([
        getSeller(sellerId),
        getProductsBySeller(sellerId),
      ]);
      setSeller(sellerData);
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error loading seller data:', error);
      Alert.alert('Error', 'Failed to load seller information');
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/(buyer)/products/${productId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading seller..." />;
  }

  if (!seller) {
    return (
      <EmptyState
        icon="❌"
        title="Seller Not Found"
        description="This seller could not be found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: seller.businessName,
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Cover Image */}
        {seller.coverImage && (
          <Image
            source={{ uri: seller.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Seller Info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {seller.avatar ? (
              <Image source={{ uri: seller.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {seller.businessName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.businessName}>{seller.businessName}</Text>
          <Text style={styles.description}>{seller.description}</Text>

          {seller.rating > 0 && (
            <Text style={styles.rating}>
              ⭐ {seller.rating.toFixed(1)} ({seller.reviewCount} reviews)
            </Text>
          )}

          {seller.categories && seller.categories.length > 0 && (
            <View style={styles.categories}>
              {seller.categories.map((category, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            Products ({products.length})
          </Text>

          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No Products"
              description="This seller hasn't listed any products yet"
            />
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <ProductCard
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    fullWidth
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avatarContainer: {
    marginTop: -40,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    marginBottom: 16,
  },
});

