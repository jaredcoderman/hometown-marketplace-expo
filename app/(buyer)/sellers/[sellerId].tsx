import { ProductCard } from '@/components/products/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getFavoritesByBuyer, getFavoritesCount, toggleFavorite } from '@/services/favorite.service';
import { getProductsBySeller } from '@/services/product.service';
import { getSeller } from '@/services/seller.service';
import { Product, Seller } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function SellerDetailScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const { show } = useToast();
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    if (!sellerId) return;

    try {
      // Ensure we don't flash previous seller content
      setLoading(true);
      setSeller(null);
      setProducts([]);
      const [sellerData, productsData] = await Promise.all([
        getSeller(sellerId),
        getProductsBySeller(sellerId),
      ]);
      setSeller(sellerData);
      setProducts(productsData);
      if (user?.id) {
        const favs = await getFavoritesByBuyer(user.id);
        setFavoriteIds(new Set(favs));
      }
      // Load favorites counts lazily for shown products
      const counts = await Promise.all(
        productsData.map(async (p) => [p.id, await getFavoritesCount(p.id)] as const)
      );
      setFavoriteCounts(Object.fromEntries(counts));
    } catch (error: any) {
      show('Failed to load seller information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user?.id) return;
    const nowFav = await toggleFavorite(user.id, productId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFav) next.add(productId); else next.delete(productId);
      return next;
    });
    setFavoriteCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] ?? 0) + (nowFav ? 1 : -1)),
    }));
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
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
              <Ionicons name="chevron-back" size={26} color="#333" />
            </Pressable>
          ),
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

          {seller.venmo && (
            <View style={styles.venmoContainer}>
              <Text style={styles.venmoText}>Venmo: @{seller.venmo}</Text>
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
                    isFavorite={favoriteIds.has(product.id)}
                    favoritesCount={favoriteCounts[product.id]}
                    onToggleFavorite={() => handleToggleFavorite(product.id)}
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
    // Ensure overlapping avatar is not clipped on web
    overflow: 'visible',
  },
  avatarContainer: {
    marginTop: -10,
    marginBottom: 16,
    zIndex: 2,
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
  venmoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  venmoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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

