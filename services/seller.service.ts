import { db } from '@/config/firebase';
import { Location, Seller, SellerWithDistance } from '@/types';
import { calculateDistance, generateGeohash } from '@/utils/location';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

const SELLERS_COLLECTION = 'sellers';

export async function getSeller(sellerId: string): Promise<Seller> {
  const sellerDoc = await getDoc(doc(db, SELLERS_COLLECTION, sellerId));
  
  if (!sellerDoc.exists()) {
    throw new Error('Seller not found');
  }

  return docToSeller(sellerDoc);
}

export async function getSellerByUserId(userId: string): Promise<Seller | null> {
  const q = query(
    collection(db, SELLERS_COLLECTION),
    where('userId', '==', userId),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  return docToSeller(snapshot.docs[0]);
}

export async function createSeller(
  sellerId: string,
  sellerData: Omit<Seller, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>
): Promise<void> {
  const geohash = generateGeohash(
    sellerData.location.latitude,
    sellerData.location.longitude
  );

  await setDoc(doc(db, SELLERS_COLLECTION, sellerId), {
    ...sellerData,
    geohash,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSeller(
  sellerId: string,
  updates: Partial<Omit<Seller, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const dataToUpdate: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // If location is updated, recalculate geohash
  if (updates.location) {
    dataToUpdate.geohash = generateGeohash(
      updates.location.latitude,
      updates.location.longitude
    );
  }

  await updateDoc(doc(db, SELLERS_COLLECTION, sellerId), dataToUpdate);
}

export async function deleteSeller(sellerId: string): Promise<void> {
  await deleteDoc(doc(db, SELLERS_COLLECTION, sellerId));
}

export async function getNearbySellers(
  userLocation: Location,
  radiusMiles: number,
  limitCount: number = 50
): Promise<SellerWithDistance[]> {
  // For simplicity, we'll fetch all sellers and filter client-side
  // In production, you'd want to use geohash queries for better performance
  const q = query(
    collection(db, SELLERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const sellers: SellerWithDistance[] = [];

  snapshot.forEach((doc) => {
    const seller = docToSeller(doc);
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      seller.location.latitude,
      seller.location.longitude
    );

    if (distance <= radiusMiles) {
      sellers.push({
        ...seller,
        distance,
      });
    }
  });

  // Sort by distance
  sellers.sort((a, b) => a.distance - b.distance);

  return sellers.slice(0, limitCount);
}

function docToSeller(doc: any): Seller {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    businessName: data.businessName,
    description: data.description,
    location: data.location,
    rating: data.rating || 0,
    reviewCount: data.reviewCount || 0,
    avatar: data.avatar,
    coverImage: data.coverImage,
    categories: data.categories || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

