import { db } from '@/config/firebase';
import { ProductReview } from '@/types';
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { getRequestsByBuyer } from './request.service';
import { getProduct, updateProduct } from './product.service';

const REVIEWS_COLLECTION = 'reviews';

// Helper to convert Firestore doc to ProductReview
function docToReview(doc: any): ProductReview {
  const data = doc.data();
  return {
    id: doc.id,
    productId: data.productId,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    buyerAvatar: data.buyerAvatar,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Check if a buyer has an approved request for a product
 */
export async function canBuyerReviewProduct(
  buyerId: string,
  productId: string
): Promise<boolean> {
  const buyerRequests = await getRequestsByBuyer(buyerId);
  
  // Check if there's at least one approved request for this product
  return buyerRequests.some(
    (req) => req.productId === productId && req.status === 'approved'
  );
}

/**
 * Check if a buyer has already reviewed a product
 */
export async function hasBuyerReviewedProduct(
  buyerId: string,
  productId: string
): Promise<boolean> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('buyerId', '==', buyerId),
    where('productId', '==', productId)
  );

  const snapshot = await getDocs(q);
  return snapshot.size > 0;
}

/**
 * Create a new review and update product ratings
 */
export async function createReview(
  productId: string,
  buyerId: string,
  buyerName: string,
  buyerAvatar: string | undefined,
  rating: number,
  comment: string
): Promise<string> {
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if buyer has approved request for this product
  const canReview = await canBuyerReviewProduct(buyerId, productId);
  if (!canReview) {
    throw new Error('You must have an approved purchase for this product to leave a review');
  }

  // Check if buyer has already reviewed this product
  const alreadyReviewed = await hasBuyerReviewedProduct(buyerId, productId);
  if (alreadyReviewed) {
    throw new Error('You have already reviewed this product');
  }

  // Create the review
  const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
  const reviewData = {
    productId,
    buyerId,
    buyerName,
    buyerAvatar,
    rating,
    comment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(reviewRef, reviewData);

  // Update product ratings
  await updateProductRatings(productId);

  return reviewRef.id;
}

/**
 * Get all reviews for a product
 */
export async function getReviewsByProduct(productId: string): Promise<ProductReview[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('productId', '==', productId)
  );

  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(docToReview);

  // Sort by createdAt descending (newest first)
  reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return reviews;
}

/**
 * Get reviews by a buyer
 */
export async function getReviewsByBuyer(buyerId: string): Promise<ProductReview[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('buyerId', '==', buyerId)
  );

  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(docToReview);

  // Sort by createdAt descending (newest first)
  reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return reviews;
}

/**
 * Update product rating and review count based on all reviews
 */
async function updateProductRatings(productId: string): Promise<void> {
  const reviews = await getReviewsByProduct(productId);

  if (reviews.length === 0) {
    // No reviews, set to default
    await updateProduct(productId, { rating: 0, reviewCount: 0 });
    return;
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Update product with new rating and review count
  await updateProduct(productId, {
    rating: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
  });
}

/**
 * Get review stats for a product
 */
export async function getReviewStats(productId: string): Promise<{
  rating: number;
  reviewCount: number;
}> {
  const reviews = await getReviewsByProduct(productId);

  if (reviews.length === 0) {
    return { rating: 0, reviewCount: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return {
    rating: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
  };
}
