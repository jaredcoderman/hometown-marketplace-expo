import { db } from '@/config/firebase';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';

const FAVORITES_COLLECTION = 'favorites';

export async function isProductFavorited(buyerId: string, productId: string): Promise<boolean> {
  const docRef = doc(db, FAVORITES_COLLECTION, `${buyerId}_${productId}`);
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function toggleFavorite(buyerId: string, productId: string): Promise<boolean> {
  const docRef = doc(db, FAVORITES_COLLECTION, `${buyerId}_${productId}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      id: `${buyerId}_${productId}`,
      buyerId,
      productId,
      createdAt: serverTimestamp(),
    });
    return true;
  }
}

export async function getFavoritesByBuyer(buyerId: string): Promise<string[]> {
  const q = query(collection(db, FAVORITES_COLLECTION), where('buyerId', '==', buyerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().productId as string);
}

export async function getFavoritesCount(productId: string): Promise<number> {
  const q = query(collection(db, FAVORITES_COLLECTION), where('productId', '==', productId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}


