import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getProduct } from '@/services/product.service';
import { getSeller } from '@/services/seller.service';
import { Product, Seller } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 300; // Fixed height for images

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    if (!productId) return;

    try {
      // Ensure we don't flash previous product/seller content when switching
      setLoading(true);
      setProduct(null);
      setSeller(null);
      const productData = await getProduct(productId);
      setProduct(productData);

      const sellerData = await getSeller(productData.sellerId);
      setSeller(sellerData);
    } catch (error: any) {
      console.error('Error loading product data:', error);
      window.alert('Failed to load product information: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContactSeller = () => {
    setShowRequestForm(!showRequestForm);
  };

  const handleSubmitRequest = async () => {
    if (!product || !seller || !user) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      window.alert('Please enter a valid quantity');
      return;
    }

    if (product.quantity !== undefined && qty > product.quantity) {
      window.alert(`Only ${product.quantity} available`);
      return;
    }

    setSubmitting(true);
    try {
      const { createRequest } = await import('@/services/request.service');

      await createRequest({
        buyerId: user.id,
        buyerName: user.name,
        buyerEmail: user.email,
        sellerId: seller.id,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: qty,
        totalPrice: product.price * qty,
        message: message.trim(),
        status: 'pending',
      });

      window.alert('Request sent successfully! The seller will review it soon.');
      setShowRequestForm(false);
      setQuantity('1');
      setMessage('');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      window.alert('Failed to send request: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading product..." />;
  }

  if (!product || !seller) {
    return (
      <EmptyState
        icon="❌"
        title="Product Not Found"
        description="This product could not be found"
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
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (seller?.id) {
                  router.replace(`/(buyer)/sellers/${seller.id}`);
                } else {
                  router.back();
                }
              }}
              style={{ paddingHorizontal: 8, paddingVertical: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color="#333" />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Product Images */}
        {product.images && product.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
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
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          {!product.inStock && (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockText}>⚠️ Out of Stock</Text>
            </View>
          )}

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
            {product.quantity !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{product.quantity}</Text>
              </View>
            )}
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <Pressable
              onPress={() => seller && router.replace(`/(buyer)/sellers/${seller.id}`)}
              style={styles.sellerCard}
            >
              <View style={styles.sellerAvatar}>
                {seller.avatar ? (
                  <Image source={{ uri: seller.avatar }} style={styles.sellerAvatarImage} />
                ) : (
                  <Text style={styles.sellerAvatarText}>
                    {seller.businessName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{seller.businessName}</Text>
                {seller.rating > 0 && (
                  <Text style={styles.sellerRating}>
                    ⭐ {seller.rating.toFixed(1)} ({seller.reviewCount})
                  </Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* Contact Button */}
          <Button
            title={showRequestForm ? "Cancel" : "Request Product"}
            onPress={handleContactSeller}
            disabled={!product.inStock}
            variant={showRequestForm ? "secondary" : "primary"}
            style={styles.contactButton}
          />

          {/* Request Form */}
          {showRequestForm && (
            <View style={styles.requestForm}>
              <Text style={styles.formTitle}>Send Request to Seller</Text>
              
              <Input
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="1"
              />

              {product.quantity !== undefined && (
                <Text style={styles.availableText}>
                  Available: {product.quantity}
                </Text>
              )}

              <View style={styles.priceCalculation}>
                <Text style={styles.calcLabel}>Price per item:</Text>
                <Text style={styles.calcValue}>{formatPrice(product.price)}</Text>
              </View>
              <View style={styles.priceCalculation}>
                <Text style={styles.calcLabel}>Total:</Text>
                <Text style={styles.calcTotal}>
                  {formatPrice(product.price * (parseInt(quantity) || 0))}
                </Text>
              </View>

              <View style={styles.messageSection}>
                <Text style={styles.messageLabel}>Message (Optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Add any additional information..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Button
                title="Send Request"
                onPress={handleSubmitRequest}
                loading={submitting}
                style={styles.submitButton}
              />

              <Text style={styles.noteText}>
                💡 The seller will review your request and contact you at {user?.email}
              </Text>
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
    backgroundColor: Colors.background,
  },
  imageScroll: {
    height: IMAGE_HEIGHT,
  },
  image: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    height: IMAGE_HEIGHT,
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
  header: {
    marginBottom: 16,
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
  },
  outOfStockBanner: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  outOfStockText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sellerRating: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  requestForm: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  availableText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },
  priceCalculation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  calcTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  messageSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
  },
  submitButton: {
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

