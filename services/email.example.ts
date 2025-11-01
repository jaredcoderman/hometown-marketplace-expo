/**
 * Email Service Usage Examples
 * 
 * This file shows how to use the email service in your app.
 * Copy these patterns into your actual implementation.
 */

import {
    initEmailService,
    sendPasswordResetEmail,
    sendRequestStatusEmail,
    sendTestEmail,
    sendWelcomeEmail
} from './email.service';

// ============================================
// STEP 1: Initialize Email Service
// ============================================
// Do this once when your app starts (e.g., in app/_layout.tsx or a config file)

// Option A: Using environment variable (recommended)
const API_KEY = process.env.RESEND_API_KEY || 'your_api_key_here';
if (API_KEY && API_KEY !== 'your_api_key_here') {
  initEmailService(API_KEY);
}

// Option B: Direct initialization (for quick testing only)
// initEmailService('re_your_api_key_here');

// ============================================
// STEP 2: Send Emails in Your App
// ============================================

// Example 1: Send welcome email after user signs up
export async function handleUserSignup(userEmail: string, userName: string, userType: 'buyer' | 'seller') {
  const result = await sendWelcomeEmail(userEmail, userName, userType);
  
  if (result.success) {
    console.log('Welcome email sent!', result.id);
  } else {
    console.error('Failed to send welcome email:', result.error);
  }
}

// Example 2: Send notification when request status changes
export async function handleRequestStatusChange(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  sellerName: string,
  status: 'approved' | 'rejected'
) {
  const result = await sendRequestStatusEmail(
    buyerEmail,
    buyerName,
    productName,
    sellerName,
    status
  );
  
  if (result.success) {
    console.log('Status notification sent!', result.id);
  } else {
    console.error('Failed to send notification:', result.error);
  }
}

// Example 3: Send password reset email
export async function handlePasswordReset(userEmail: string, userName: string) {
  // Generate a reset token (use Firebase Auth or your auth system)
  const resetToken = 'generate-your-token-here';
  const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;
  
  const result = await sendPasswordResetEmail(userEmail, userName, resetLink);
  
  if (result.success) {
    console.log('Password reset email sent!', result.id);
  } else {
    console.error('Failed to send reset email:', result.error);
  }
}

// Example 4: Test email functionality
export async function testEmailService(testEmail: string) {
  const result = await sendTestEmail(testEmail);
  
  if (result.success) {
    console.log('Test email sent!', result.id);
    return true;
  } else {
    console.error('Test failed:', result.error);
    return false;
  }
}

// ============================================
// Integration Examples
// ============================================

// Example: In your signup handler
// import { handleUserSignup } from './email.example';
// 
// async function onSignupSuccess(userData) {
//   // ... create user account ...
//   
//   // Send welcome email
//   await handleUserSignup(userData.email, userData.name, userData.userType);
// }

// Example: In your request approval handler
// import { handleRequestStatusChange } from './email.example';
//
// async function onRequestApproved(request) {
//   // ... update request status ...
//   
//   // Send notification email
//   await handleRequestStatusChange(
//     request.buyerEmail,
//     request.buyerName,
//     request.productName,
//     request.sellerName,
//     'approved'
//   );
// }

