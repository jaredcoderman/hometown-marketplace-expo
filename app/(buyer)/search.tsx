import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Product } from '@/types';
import { getAllProducts } from '@/services/product.service';
import { ProductCard } from '@/components/products/product-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
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
      </View>

      {loading ? (
        <LoadingSpinner message="Searching..." />
      ) : searched && products.length === 0 ? (
        <EmptyState
          iconNode={<Ionicons name="search-outline" size={56} color="#999" />}
          title="No Results"
          description={`No products found for "${searchQuery}"`}
        />
      ) : !searched ? (
        <EmptyState
          iconNode={<Ionicons name="search-outline" size={56} color="#999" />}
          title="Search Products"
          description="Start typing to search for products from local sellers"
        />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id)}
            />
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
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
});

