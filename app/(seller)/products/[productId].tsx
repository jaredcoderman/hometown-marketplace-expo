import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { deleteProduct, getProduct, toggleProductStock } from '@/services/product.service';
import { Product } from '@/types';
import { confirmAsync, showAlert } from '@/utils/dialogs';
import { formatPrice } from '@/utils/formatters';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function SellerProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingQty, setUpdatingQty] = useState(false);
  const [quantityInput, setQuantityInput] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);
  const [qtyInputY, setQtyInputY] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;

    try {
      const productData = await getProduct(productId);
      setProduct(productData);
      setQuantityInput(
        typeof productData.quantity === 'number' ? String(productData.quantity) : ''
      );
    } catch (error: any) {
      console.error('Error loading product:', error);
      showAlert('Failed to load product', error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async () => {
    if (!product) return;

    try {
      console.log('Toggling stock status...');
      await toggleProductStock(product.id, !product.inStock);
      setProduct({ ...product, inStock: !product.inStock });
      showAlert('Success', `Product marked as ${!product.inStock ? 'in stock' : 'out of stock'}`);
    } catch (error: any) {
      console.error('Error updating stock:', error);
      showAlert('Failed to update stock status', error.message || 'Unknown error');
    }
  };

  const handleUpdateQuantity = async () => {
    if (!product) return;
    const parsed = parseInt(quantityInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      showAlert('Invalid quantity', 'Please enter a non-negative whole number.');
      return;
    }
    setUpdatingQty(true);
    try {
      const { updateProduct } = await import('@/services/product.service');
      await updateProduct(product.id, { quantity: parsed, inStock: parsed > 0 });
      setProduct({ ...product, quantity: parsed, inStock: parsed > 0 });
      showAlert('Success', 'Quantity updated');
    } catch (error: any) {
      showAlert('Failed to update quantity', error.message || 'Unknown error');
    } finally {
      setUpdatingQty(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    console.log('Delete button clicked for product:', product.id);
    const confirmed = await confirmAsync('Are you sure you want to delete this product? This action cannot be undone.');
    
    if (confirmed) {
      try {
        console.log('Deleting product...');
        await deleteProduct(product.id);
        console.log('Product deleted successfully, navigating back');
        // Navigate immediately without showing success alert
        router.back();
      } catch (error: any) {
        console.error('Error deleting product:', error);
        showAlert('Failed to delete product', error.message || 'Unknown error');
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading product..." />;
  }

  if (!product) {
    return (
      <EmptyState
        icon="❌"
        title="Product Not Found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: product.name,
          headerShown: true,
        }}
      />
      <ScrollView
        style={styles.container}
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Images */}
        {product.images && product.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled style={styles.imageScroll}>
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Status Badge */}
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
              {product.inStock ? '✓ In Stock' : '✕ Out of Stock'}
            </Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            <View style={styles.detailRowCentered}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <View
                style={styles.qtyEditorRow}
                onLayout={(e) => setQtyInputY(e.nativeEvent.layout.y)}
              >
                <Input
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.qtyInput}
                  containerStyle={styles.qtyInputContainer}
                  onFocus={() => {
                    if (Platform.OS === 'ios') {
                      requestAnimationFrame(() => {
                        scrollRef.current?.scrollTo({ y: Math.max(qtyInputY - 80, 0), animated: true });
                      });
                    }
                  }}
                />
                <Button
                  title="Update"
                  onPress={handleUpdateQuantity}
                  loading={updatingQty}
                  style={styles.qtyUpdateButton}
                />
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
              onPress={handleToggleStock}
              variant="secondary"
              style={styles.actionButton}
            />

            <Button
              title="Delete Product"
              onPress={handleDelete}
              variant="danger"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageScroll: {
    height: 300,
  },
  image: {
    width: 400,
    height: 300,
  },
  imagePlaceholder: {
    height: 300,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: Colors.textLight,
  },
  content: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  inStockBadge: {
    backgroundColor: '#E8F5E9',
  },
  outOfStockBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inStockText: {
    color: Colors.success,
  },
  outOfStockText: {
    color: Colors.error,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  detailRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyInput: {
    width: 55,
    marginRight: 8,
  },
  qtyInputContainer: {
    marginBottom: 0,
  },
  qtyUpdateButton: {
    paddingVertical: 10,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});

