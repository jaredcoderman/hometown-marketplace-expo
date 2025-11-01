import { ProductCard } from '@/components/products/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { getFavoritesByBuyer, getFavoritesCount, toggleFavorite } from '@/services/favorite.service';
import { getAllProducts } from '@/services/product.service';
import { getSeller } from '@/services/seller.service';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [sellerNamesById, setSellerNamesById] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadFavs() {
      if (!user?.id) return;
      const favs = await getFavoritesByBuyer(user.id);
      setFavoriteIds(new Set(favs));
    }
    loadFavs();
  }, [user?.id]);

  useEffect(() => {
    async function loadFavoritesProducts() {
      if (!onlyFavorites || !user?.id || favoriteIds.size === 0) {
        if (!onlyFavorites) return;
        // If favorites is on but no favorites, show empty state
        if (onlyFavorites) {
          setProducts([]);
          setSearched(true);
        }
        return;
      }
      
      setLoading(true);
      try {
        const { getProduct } = await import('@/services/product.service');
        const favoriteProductIds = Array.from(favoriteIds);
        const favoriteProducts = await Promise.all(
          favoriteProductIds.map(async (id) => {
            try {
              return await getProduct(id);
            } catch {
              return null;
            }
          })
        );
        const validProducts = favoriteProducts.filter((p): p is Product => p !== null);
        setProducts(validProducts);
        setSearched(true);

        // Load counts and seller names
        const counts = await Promise.all(
          validProducts.map(async (p) => [p.id, await getFavoritesCount(p.id)] as const)
        );
        setFavoriteCounts(Object.fromEntries(counts));

        const uniqueSellerIds = Array.from(new Set(validProducts.map((p) => p.sellerId)));
        const sellerPairs = await Promise.all(
          uniqueSellerIds.map(async (id) => {
            try { const s = await getSeller(id); return [id, s.businessName] as const; }
            catch { return [id, ''] as const; }
          })
        );
        setSellerNamesById((prev) => ({ ...prev, ...Object.fromEntries(sellerPairs) }));
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFavoritesProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyFavorites, user?.id]);

  // Reload favorite IDs and counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (products.length > 0 && user?.id) {
        // Reload favorite IDs and counts without full reload
        const reloadFavorites = async () => {
          try {
            const [favs, counts] = await Promise.all([
              getFavoritesByBuyer(user.id),
              Promise.all(
                products.map(async (p) => [p.id, await getFavoritesCount(p.id)] as const)
              ),
            ]);
            setFavoriteIds(new Set(favs));
            setFavoriteCounts(Object.fromEntries(counts));
          } catch (error) {
            // Silently fail - favorites are not critical
          }
        };
        reloadFavorites();
      }
    }, [products, user?.id])
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // Don't search if favorites toggle is on
    if (onlyFavorites) {
      return;
    }
    
    if (query.length < 2) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const results = await getAllProducts({ searchQuery: query });
      setProducts(results);
      // Load counts lazily
      const counts = await Promise.all(
        results.map(async (p) => [p.id, await getFavoritesCount(p.id)] as const)
      );
      setFavoriteCounts(Object.fromEntries(counts));

      // Load seller names for display
      const uniqueSellerIds = Array.from(new Set(results.map((p) => p.sellerId)));
      const sellerPairs = await Promise.all(
        uniqueSellerIds.map(async (id) => {
          try { const s = await getSeller(id); return [id, s.businessName] as const; }
          catch { return [id, ''] as const; }
        })
      );
      setSellerNamesById((prev) => ({ ...prev, ...Object.fromEntries(sellerPairs) }));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/(buyer)/products/${productId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <View style={styles.filterRow}>
          <Switch 
            value={onlyFavorites} 
            onValueChange={(value) => {
              setOnlyFavorites(value);
              if (!value) {
                // Clear products when turning off favorites
                setProducts([]);
                setSearched(false);
              }
            }} 
          />
          <View style={{ width: 8 }} />
          <TextInput editable={false} value={onlyFavorites ? 'Only favorites' : 'All results'} style={styles.fakeLabel} />
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message={onlyFavorites ? "Loading favorites..." : "Searching..."} />
      ) : onlyFavorites && products.length === 0 && searched ? (
        <EmptyState
          iconNode={<Ionicons name="heart-outline" size={56} color="#999" />}
          title="No Favorites"
          description="You haven't favorited any products yet. Start browsing and heart products you like!"
        />
      ) : searched && products.length === 0 ? (
        <EmptyState
          iconNode={<Ionicons name="search-outline" size={56} color="#999" />}
          title="No Results"
          description={`No products found for "${searchQuery}"`}
        />
      ) : !searched && !onlyFavorites ? (
        <EmptyState
          iconNode={<Ionicons name="search-outline" size={56} color="#999" />}
          title="Search Products"
          description="Start typing to search for products from local sellers"
        />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item.id)}
                isFavorite={favoriteIds.has(item.id)}
                favoritesCount={favoriteCounts[item.id]}
                onToggleFavorite={async () => {
                  if (!user?.id) return;
                  const nowFav = await toggleFavorite(user.id, item.id);
                  setFavoriteIds((prev) => {
                    const next = new Set(prev);
                    if (nowFav) next.add(item.id); else next.delete(item.id);
                    return next;
                  });
                  setFavoriteCounts((prev) => ({
                    ...prev,
                    [item.id]: Math.max(0, (prev[item.id] ?? 0) + (nowFav ? 1 : -1)),
                  }));
                  // If in favorites-only mode, update the products list
                  if (onlyFavorites) {
                    if (nowFav) {
                      // Product is already in the list (item), so no need to add
                      // Just ensure it's marked as favorite
                    } else {
                      // Remove product from list when unfavorited
                      setProducts((prev) => prev.filter(p => p.id !== item.id));
                    }
                  }
                }}
              />
              {sellerNamesById[item.sellerId] ? (
                <Text style={styles.brandName}>{sellerNamesById[item.sellerId]}</Text>
              ) : null}
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
  searchContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fakeLabel: {
    color: '#666',
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  brandName: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

