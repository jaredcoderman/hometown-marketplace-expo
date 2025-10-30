import { db } from '@/config/firebase';
import { ProductRequest } from '@/types';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';

const REQUESTS_COLLECTION = 'requests';

// Helper to convert Firestore doc to ProductRequest
function docToRequest(doc: any): ProductRequest {
  const data = doc.data();
  return {
    id: doc.id,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    sellerId: data.sellerId,
    productId: data.productId,
    productName: data.productName,
    productPrice: data.productPrice,
    quantity: data.quantity,
    totalPrice: data.totalPrice,
    message: data.message,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// Create a new request
export async function createRequest(
  requestData: Omit<ProductRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
    ...requestData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Get request by ID
export async function getRequest(requestId: string): Promise<ProductRequest> {
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Request not found');
  }

  return docToRequest(docSnap);
}

// Get all requests for a seller
export async function getRequestsBySeller(sellerId: string): Promise<ProductRequest[]> {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('sellerId', '==', sellerId)
  );

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(docToRequest);

  // Sort by createdAt descending (newest first)
  requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return requests;
}

// Get all requests by a buyer
export async function getRequestsByBuyer(buyerId: string): Promise<ProductRequest[]> {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('buyerId', '==', buyerId)
  );

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(docToRequest);

  // Sort by createdAt descending (newest first)
  requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return requests;
}

// Update request status
export async function updateRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

// Subscribe to real-time updates for buyer requests
export function subscribeToBuyerRequests(
  buyerId: string,
  onUpdate: (requests: ProductRequest[]) => void
): () => void {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('buyerId', '==', buyerId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(docToRequest);
    // Sort by createdAt descending (newest first)
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onUpdate(requests);
  });
}

