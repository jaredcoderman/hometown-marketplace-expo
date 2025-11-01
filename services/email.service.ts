import { Resend } from 'resend';

// Initialize Resend client
// For production, this should use an environment variable
// For now, we'll use a configurable API key
let resendClient: Resend | null = null;

/**
 * Initialize the Resend client with an API key
 * Call this once when your app starts, preferably from server-side code
 */
export function initEmailService(apiKey: string) {
  if (apiKey) {
    resendClient = new Resend(apiKey);
  }
}

/**
 * Check if email service is initialized
 */
export function isEmailServiceInitialized(): boolean {
  return resendClient !== null;
}

/**
 * Email templates and sending functions
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string; // Optional override for sender email
}

/**
 * Send a simple email
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resendClient) {
    console.error('Email service not initialized. Call initEmailService() first.');
    return { success: false, error: 'Email service not initialized' };
  }

  try {
    // Default sender - you'll need to verify your domain with Resend
    // For testing, you can use their test domain: 'onboarding@resend.dev'
    const fromEmail = options.from || 'onboarding@resend.dev';
    
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  userType: 'buyer' | 'seller'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Hometown Marketplace!</h1>
        </div>
        <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
          <p>Hi ${userName},</p>
          <p>Welcome to Hometown Marketplace! We're excited to have you join our community.</p>
          <p>Your account has been created as a <strong>${userType === 'seller' ? 'Seller' : 'Buyer'}</strong>.</p>
          <p>Get started by exploring local sellers and products in your area.</p>
          <p style="margin-top: 30px;">Happy shopping!</p>
          <p>The Hometown Marketplace Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Hometown Marketplace!

Hi ${userName},

Welcome to Hometown Marketplace! We're excited to have you join our community.

Your account has been created as a ${userType === 'seller' ? 'Seller' : 'Buyer'}.

Get started by exploring local sellers and products in your area.

Happy shopping!
The Hometown Marketplace Team
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Hometown Marketplace!',
    html,
    text,
  });
}

/**
 * Send a request status notification email
 */
export async function sendRequestStatusEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  sellerName: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const statusText = status === 'approved' ? 'approved' : 'rejected';
  const statusColor = status === 'approved' ? '#689F38' : '#C62828';
  const statusIcon = status === 'approved' ? '✓' : '✗';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h1>
        </div>
        <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
          <p>Hi ${buyerName},</p>
          <div style="background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 18px;">
              <strong style="color: ${statusColor};">${statusIcon} Your request for "${productName}" has been ${statusText}.</strong>
            </p>
          </div>
          <p><strong>Seller:</strong> ${sellerName}</p>
          <p><strong>Product:</strong> ${productName}</p>
          ${status === 'approved' 
            ? '<p>Great news! Your request has been approved. You can proceed with the purchase.</p>' 
            : '<p>Unfortunately, your request could not be approved at this time. You can try requesting a different product or quantity.</p>'}
          <p style="margin-top: 30px;">Best regards,<br>The Hometown Marketplace Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}

Hi ${buyerName},

Your request for "${productName}" from ${sellerName} has been ${statusText}.

${status === 'approved' 
  ? 'Great news! Your request has been approved. You can proceed with the purchase.' 
  : 'Unfortunately, your request could not be approved at this time.'}

Best regards,
The Hometown Marketplace Team
  `;

  return sendEmail({
    to: buyerEmail,
    subject: `Your request for "${productName}" has been ${statusText}`,
    html,
    text,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
          <p>Hi ${userName},</p>
          <p>You requested to reset your password for your Hometown Marketplace account.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #D2691E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6D4C41; background-color: #FFF8F0; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>
          <p style="color: #6D4C41; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="margin-top: 30px; color: #6D4C41; font-size: 14px;">
            If you didn't request this password reset, please ignore this email.
          </p>
          <p>Best regards,<br>The Hometown Marketplace Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

Hi ${userName},

You requested to reset your password for your Hometown Marketplace account.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The Hometown Marketplace Team
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Reset Your Hometown Marketplace Password',
    html,
    text,
  });
}

/**
 * Send a test email
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Test Email</h1>
        </div>
        <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
          <p>This is a test email from Hometown Marketplace.</p>
          <p>If you received this email, your email service is configured correctly! 🎉</p>
          <p style="margin-top: 30px;">Best regards,<br>The Hometown Marketplace Team</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: 'Test Email from Hometown Marketplace',
    html,
    text: 'This is a test email from Hometown Marketplace. If you received this, your email service is configured correctly!',
  });
}

