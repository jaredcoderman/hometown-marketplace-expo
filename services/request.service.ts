import { db } from '@/config/firebase';
import { ProductRequest } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import {
    sendRequestCreatedEmailToBuyerAPI,
    sendRequestCreatedEmailToSellerAPI
} from './email-api.service';
import { getSeller } from './seller.service';
import { getUser } from './user.service';

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

  // Send email notifications (fire and forget - don't block request creation)
  // Use void to explicitly mark as fire-and-forget
  // Wrap in Promise.resolve().then() to ensure it runs even if there are issues
  Promise.resolve().then(async () => {
    try {
      console.log('[EMAIL] ===== STARTING EMAIL NOTIFICATION PROCESS =====');
      console.log('[EMAIL] Starting email notification process for request creation...');
      console.log('[EMAIL] Request data:', {
        buyerEmail: requestData.buyerEmail,
        buyerName: requestData.buyerName,
        sellerId: requestData.sellerId,
        productName: requestData.productName,
      });
      
      // Get seller information for email
      const seller = await getSeller(requestData.sellerId);
      console.log('[EMAIL] Seller retrieved:', seller.businessName);
      
      const sellerUser = await getUser(seller.userId);
      console.log('[EMAIL] Seller user retrieved:', { email: sellerUser.email, userId: seller.userId });

      // Send email to buyer
      console.log('[EMAIL] Sending email to buyer:', requestData.buyerEmail);
      try {
        const buyerEmailResult = await sendRequestCreatedEmailToBuyerAPI(
          requestData.buyerEmail,
          requestData.buyerName,
          seller.businessName,
          requestData.productName,
          requestData.quantity,
          requestData.productPrice,
          requestData.totalPrice,
          requestData.message
        );
        console.log('[EMAIL] Buyer email result:', buyerEmailResult);
        if (!buyerEmailResult.success) {
          console.error('[EMAIL] Buyer email failed:', buyerEmailResult.error);
        }
      } catch (buyerError: any) {
        console.error('[EMAIL] Buyer email exception:', buyerError);
        console.error('[EMAIL] Buyer email error details:', {
          message: buyerError?.message,
          code: buyerError?.code,
          stack: buyerError?.stack,
        });
      }

      // Send email to seller
      console.log('[EMAIL] Sending email to seller:', sellerUser.email);
      try {
        const sellerEmailResult = await sendRequestCreatedEmailToSellerAPI(
          sellerUser.email,
          seller.businessName,
          requestData.buyerName,
          requestData.buyerEmail,
          requestData.productName,
          requestData.quantity,
          requestData.productPrice,
          requestData.totalPrice,
          requestData.message
        );
        console.log('[EMAIL] Seller email result:', sellerEmailResult);
        if (!sellerEmailResult.success) {
          console.error('[EMAIL] Seller email failed:', sellerEmailResult.error);
        }
      } catch (sellerError: any) {
        console.error('[EMAIL] Seller email exception:', sellerError);
        console.error('[EMAIL] Seller email error details:', {
          message: sellerError?.message,
          code: sellerError?.code,
          stack: sellerError?.stack,
        });
      }
    } catch (error) {
      // Log error but don't fail the request creation
      console.error('[EMAIL] Failed to send request creation emails:', error);
      console.error('[EMAIL] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
    }
  }).catch((err) => {
    // Catch any unhandled errors in the promise chain
    console.error('[EMAIL] Unhandled error in email notification promise:', err);
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

// Delete a request (for buyers to retract pending requests)
export async function deleteRequest(requestId: string): Promise<void> {
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  await deleteDoc(docRef);
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

