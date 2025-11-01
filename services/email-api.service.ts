/**
 * Client-side email API service
 * This calls Firebase Cloud Functions to send emails (server-side)
 * 
 * This is the client-side wrapper. You'll also need to set up
 * Firebase Cloud Functions (see EMAIL_FUNCTIONS_SETUP.md)
 */

import { app } from '@/config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase Functions with explicit region
// Functions are deployed to us-central1, so we must specify the region
// This works for both localhost (connecting to deployed functions) and production
const functions = getFunctions(app, 'us-central1');

console.log('[EMAIL-API] Functions initialized for region: us-central1');

/**
 * Send a test email via Cloud Function
 */
export async function sendTestEmailAPI(email: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sendTestEmail = httpsCallable(functions, 'sendTestEmail');
    const result = await sendTestEmail({ email });
    return result.data as { success: boolean; id?: string; error?: string };
  } catch (error: any) {
    console.error('Email API error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Send a welcome email via Cloud Function
 */
export async function sendWelcomeEmailAPI(
  email: string,
  name: string,
  userType: 'buyer' | 'seller'
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
    const result = await sendWelcomeEmail({ email, name, userType });
    return result.data as { success: boolean; id?: string; error?: string };
  } catch (error: any) {
    console.error('Email API error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Send a request status email via Cloud Function
 */
export async function sendRequestStatusEmailAPI(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  sellerName: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sendRequestStatusEmail = httpsCallable(functions, 'sendRequestStatusEmail');
    const result = await sendRequestStatusEmail({
      buyerEmail,
      buyerName,
      productName,
      sellerName,
      status,
    });
    return result.data as { success: boolean; id?: string; error?: string };
  } catch (error: any) {
    console.error('Email API error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Send email to buyer when they create a request
 */
export async function sendRequestCreatedEmailToBuyerAPI(
  buyerEmail: string,
  buyerName: string,
  sellerName: string,
  productName: string,
  quantity: number,
  productPrice: number,
  totalPrice: number,
  message: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log('[EMAIL-API] Calling sendRequestCreatedEmailToBuyer with:', {
      buyerEmail,
      buyerName,
      sellerName,
      productName,
    });
    
    const sendRequestCreatedEmailToBuyer = httpsCallable(functions, 'sendRequestCreatedEmailToBuyer');
    const result = await sendRequestCreatedEmailToBuyer({
      buyerEmail,
      buyerName,
      sellerName,
      productName,
      quantity,
      productPrice,
      totalPrice,
      message,
    });
    
    const response = result.data as { success: boolean; id?: string; error?: string };
    console.log('[EMAIL-API] sendRequestCreatedEmailToBuyer response:', response);
    
    return response;
  } catch (error: any) {
    console.error('[EMAIL-API] sendRequestCreatedEmailToBuyer error:', error);
    console.error('[EMAIL-API] Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      stack: error?.stack,
    });
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Send email to seller when they receive a request
 */
export async function sendRequestCreatedEmailToSellerAPI(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  buyerEmail: string,
  productName: string,
  quantity: number,
  productPrice: number,
  totalPrice: number,
  message: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log('[EMAIL-API] Calling sendRequestCreatedEmailToSeller with:', {
      sellerEmail,
      sellerName,
      buyerName,
      buyerEmail,
      productName,
    });
    
    const sendRequestCreatedEmailToSeller = httpsCallable(functions, 'sendRequestCreatedEmailToSeller');
    const result = await sendRequestCreatedEmailToSeller({
      sellerEmail,
      sellerName,
      buyerName,
      buyerEmail,
      productName,
      quantity,
      productPrice,
      totalPrice,
      message,
    });
    
    const response = result.data as { success: boolean; id?: string; error?: string };
    console.log('[EMAIL-API] sendRequestCreatedEmailToSeller response:', response);
    
    return response;
  } catch (error: any) {
    console.error('[EMAIL-API] sendRequestCreatedEmailToSeller error:', error);
    console.error('[EMAIL-API] Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      stack: error?.stack,
    });
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

