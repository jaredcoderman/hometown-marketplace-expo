import { db } from '@/config/firebase';
import { Product, ProductFilters } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';

const PRODUCTS_COLLECTION = 'products';

export async function getProduct(productId: string): Promise<Product> {
  const productDoc = await getDoc(doc(db, PRODUCTS_COLLECTION, productId));
  
  if (!productDoc.exists()) {
    throw new Error('Product not found');
  }

  return docToProduct(productDoc);
}

export async function getProductsBySeller(
  sellerId: string,
  filters?: ProductFilters
): Promise<Product[]> {
  // Remove orderBy to avoid index requirements
  let q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('sellerId', '==', sellerId)
  );

  const snapshot = await getDocs(q);
  let products = snapshot.docs.map(docToProduct);

  // Sort client-side by createdAt
  products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply client-side filters
  if (filters) {
    products = applyFilters(products, filters);
  }

  return products;
}

export async function getAllProducts(
  filters?: ProductFilters,
  limitCount: number = 50
): Promise<Product[]> {
  // Fetch without orderBy to avoid index requirements
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  let products = snapshot.docs.map(docToProduct);

  // Sort client-side by createdAt
  products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (filters) {
    products = applyFilters(products, filters);
  }

  return products.slice(0, limitCount);
}

export async function createProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  // Automatically set inStock to false if quantity reaches 0
  if (updates.quantity !== undefined) {
    updates.inStock = updates.quantity > 0;
  }

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
}

export async function toggleProductStock(
  productId: string,
  inStock: boolean
): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    inStock,
    updatedAt: serverTimestamp(),
  });
}

function docToProduct(doc: any): Product {
  const data = doc.data();
  return {
    id: doc.id,
    sellerId: data.sellerId,
    name: data.name,
    description: data.description,
    price: data.price,
    images: data.images || [],
    category: data.category,
    inStock: data.inStock ?? true,
    quantity: data.quantity,
    emoji: data.emoji,
    tags: data.tags || [],
    rating: data.rating || 0,
    reviewCount: data.reviewCount || 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  let filtered = [...products];

  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters.inStock !== undefined) {
    filtered = filtered.filter((p) => p.inStock === filters.inStock);
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
}

