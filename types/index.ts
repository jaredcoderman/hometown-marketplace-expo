// Core types for the Hometown Marketplace app

export type UserType = 'buyer' | 'seller';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  location?: Location;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: string;
  avatar?: string;
}

export interface Seller {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  location: Location;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  coverImage?: string;
  categories?: string[];
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  images: string[]; // may be empty
  category: string;
  inStock: boolean;
  quantity?: number;
  emoji?: string; // optional emoji icon for display when no image
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface ProductWithSeller extends Product {
  seller: Seller;
}

export interface SellerWithDistance extends Seller {
  distance: number; // in miles or kilometers
}

// Auth related types
export interface SignupData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
}

export interface LoginData {
  email: string;
  password: string;
}

// Location search params
export interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radiusMiles: number;
}

// Product filters
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchQuery?: string;
}

// Product Request
export interface ProductRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Favorites
export interface FavoriteProduct {
  id: string; // doc id (productId)
  productId: string;
  buyerId: string;
  createdAt: Date;
}

// Bug Reports
export interface BugReport {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

