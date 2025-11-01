import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StarRating } from '@/components/ui/star-rating';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getFavoritesCount, isProductFavorited, toggleFavorite } from '@/services/favorite.service';
import { getProduct } from '@/services/product.service';
import { getReviewsByProduct, canBuyerReviewProduct, hasBuyerReviewedProduct, createReview } from '@/services/review.service';
import { getSeller } from '@/services/seller.service';
import { Product, ProductReview, Seller } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
  const { show } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  useEffect(() => {
    async function checkFav() {
      if (user?.id && productId) {
        try {
          const fav = await isProductFavorited(user.id, String(productId));
          setIsFavorite(fav);
        } catch {}
      }
    }
    checkFav();
  }, [user?.id, productId]);

  useEffect(() => {
    async function loadCount() {
      if (!productId) return;
      try {
        const count = await getFavoritesCount(String(productId));
        setFavoritesCount(count);
      } catch {}
    }
    loadCount();
  }, [productId]);

  // Reload favorite count and favorite status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (productId && user?.id) {
        const reloadFavoriteData = async () => {
          try {
            const [fav, count] = await Promise.all([
              isProductFavorited(user.id, String(productId)),
              getFavoritesCount(String(productId)),
            ]);
            setIsFavorite(fav);
            setFavoritesCount(count);
          } catch {}
        };
        reloadFavoriteData();
      }
    }, [productId, user?.id])
  );

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
      show('Failed to load product information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!productId) return;

    setLoadingReviews(true);
    try {
      const reviewsData = await getReviewsByProduct(productId);
      setReviews(reviewsData);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!productId || !user?.id) return;

    try {
      const [canReviewProduct, reviewedProduct] = await Promise.all([
        canBuyerReviewProduct(user.id, productId),
        hasBuyerReviewedProduct(user.id, productId)
      ]);
      setCanReview(canReviewProduct);
      setHasReviewed(reviewedProduct);
    } catch (error: any) {
      console.error('Error checking review eligibility:', error);
    }
  };

  useEffect(() => {
    loadReviews();
    checkReviewEligibility();
  }, [productId, user?.id]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleContactSeller = () => {
    setShowRequestForm(!showRequestForm);
  };

  const handleSubmitRequest = async () => {
    if (!product || !seller || !user) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      show('Please enter a valid quantity', 'error');
      return;
    }

    if (product.quantity !== undefined && qty > product.quantity) {
      show(`Only ${product.quantity} available`, 'error');
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

      show('Request sent! The seller will review it soon.', 'success');
      setShowRequestForm(false);
      setQuantity('1');
      setMessage('');
    } catch (error: any) {
      show('Failed to send request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!productId || !user) return;

    if (!reviewComment.trim()) {
      show('Please write a review comment', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await createReview(
        productId,
        user.id,
        user.name,
        user.avatar,
        reviewRating,
        reviewComment.trim()
      );

      show('Review submitted successfully!', 'success');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      
      // Reload reviews and recheck eligibility
      await Promise.all([loadReviews(), checkReviewEligibility()]);
    } catch (error: any) {
      show(error.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
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
          headerRight: () => null,
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
            <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
            <Pressable
              onPress={async () => {
                if (!user?.id) return;
                const nowFav = await toggleFavorite(user.id, product.id);
                setIsFavorite(nowFav);
                setFavoritesCount((c) => Math.max(0, c + (nowFav ? 1 : -1)));
              }}
              style={styles.favoriteButton}
            >
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? '#d9534f' : '#333'} 
              />
              <Text style={styles.favCount}>{favoritesCount}</Text>
            </Pressable>
          </View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>

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

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {product.rating && product.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <StarRating rating={product.rating} size={16} readonly />
                  <Text style={styles.ratingText}>
                    {product.rating.toFixed(1)} ({product.reviewCount || 0})
                  </Text>
                </View>
              )}
            </View>

            {/* Write Review Button - Only show if buyer can review */}
            {canReview && !hasReviewed && !showReviewForm && (
              <Button
                title="Write a Review"
                onPress={() => setShowReviewForm(true)}
                variant="outline"
                size="small"
                style={styles.writeReviewButton}
              />
            )}

            {/* Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>Write Your Review</Text>
                
                <View style={styles.ratingSelector}>
                  <Text style={styles.ratingLabel}>Rating:</Text>
                  <StarRating 
                    rating={reviewRating} 
                    onRatingChange={setReviewRating}
                    size={28}
                  />
                </View>

                <View style={styles.messageSection}>
                  <Text style={styles.messageLabel}>Your Review:</Text>
                  <TextInput
                    style={styles.messageInput}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Share your experience with this product..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.reviewFormActions}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowReviewForm(false);
                      setReviewComment('');
                      setReviewRating(5);
                    }}
                    variant="secondary"
                    style={{ flex: 1 }}
                  />
                  <View style={{ width: 12 }} />
                  <Button
                    title="Submit Review"
                    onPress={handleSubmitReview}
                    loading={submittingReview}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <LoadingSpinner message="Loading reviews..." />
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        {review.buyerAvatar ? (
                          <Image 
                            source={{ uri: review.buyerAvatar }} 
                            style={styles.reviewerAvatar}
                          />
                        ) : (
                          <View style={styles.reviewerAvatarPlaceholder}>
                            <Text style={styles.reviewerAvatarText}>
                              {review.buyerName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewerDetails}>
                          <Text style={styles.reviewerName}>{review.buyerName}</Text>
                          <Text style={styles.reviewDate}>
                            {review.createdAt.toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <StarRating rating={review.rating} size={16} readonly />
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 6,
  },
  favCount: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
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
  // Review styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  writeReviewButton: {
    marginBottom: 16,
  },
  reviewForm: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  reviewFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  reviewFormActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

