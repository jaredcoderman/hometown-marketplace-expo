import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as functionsV2 from "firebase-functions/v2";
import { Resend } from "resend";

// Define the secret for Resend API key
const resendApiKeySecret = defineSecret("RESEND_API_KEY");

// Email configuration - UPDATE THIS after verifying your domain in Resend
const FROM_EMAIL = "noreply@hometown-marketplace.com"; // TODO: Change to your verified domain (e.g., "noreply@yourdomain.com")

// Get Resend instance with API key from secret
function getResendInstance() {
  const apiKey = resendApiKeySecret.value();
  if (!apiKey) {
    throw new Error("Resend API key not configured. Set the RESEND_API_KEY secret.");
  }
  return new Resend(apiKey);
}

// Send test email
export const sendTestEmail = functionsV2.https.onCall(
  { secrets: [resendApiKeySecret] },
  async (request) => {
    const data = request.data;
    
    try {
      logger.info("Received data in sendTestEmail", { 
        data,
        type: typeof data,
        hasEmail: !!(data?.email),
        emailType: typeof data?.email,
        keys: data ? Object.keys(data) : []
      });

      const email = data?.email || data?.data?.email;
      if (!email || typeof email !== 'string' || !email.trim()) {
        logger.error("Invalid email provided", { data, extractedEmail: email });
        return {
          success: false,
          error: "Email address is required",
        };
      }

      const emailTo = email.trim();
      logger.info("Attempting to send test email", { email: emailTo });
      const resend = getResendInstance();
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: emailTo,
        subject: "Test Email from Hometown Marketplace",
        html: `
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
        `,
        text: "This is a test email from Hometown Marketplace. If you received this, your email service is configured correctly!",
      });

      logger.info("Resend API response", { 
        fullResult: JSON.stringify(result, null, 2),
        hasData: !!result.data,
        hasError: !!result.error,
        dataId: result.data?.id,
      });

      if (result.error) {
        logger.error("Resend API returned error", result.error);
        return {
          success: false,
          error: result.error.message || "Resend API error",
        };
      }

      const emailId = result.data?.id || (result as any).id;
      if (!emailId) {
        logger.warn("Resend API returned success but no email ID", { result });
        return {
          success: true,
          id: null,
          error: "Email queued but ID not available (check Resend dashboard)",
        };
      }

      logger.info("Test email sent successfully", { 
        email: emailTo, 
        emailId: emailId
      });
      return { success: true, id: emailId };
    } catch (error: any) {
      logger.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }
);

// Send welcome email
export const sendWelcomeEmail = functionsV2.https.onCall(
  { secrets: [resendApiKeySecret] },
  async (request) => {
    const data = request.data;
    
    try {
      logger.info("Received data in sendWelcomeEmail", { 
        data,
        type: typeof data,
        hasEmail: !!(data?.email),
        keys: data ? Object.keys(data) : []
      });

      const email = data?.email || data?.data?.email;
      const name = data?.name || data?.data?.name;
      const userType = data?.userType || data?.data?.userType;

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
              <p>Hi ${name},</p>
              <p>Welcome to Hometown Marketplace! We're excited to have you join our community.</p>
              <p>Your account has been created as a <strong>${
                userType === "seller" ? "Seller" : "Buyer"
              }</strong>.</p>
              <p>Get started by exploring local sellers and products in your area.</p>
              <p style="margin-top: 30px;">Happy shopping!</p>
              <p>The Hometown Marketplace Team</p>
            </div>
          </body>
        </html>
      `;

      const text = `
Welcome to Hometown Marketplace!

Hi ${name},

Welcome to Hometown Marketplace! We're excited to have you join our community.

Your account has been created as a ${userType === "seller" ? "Seller" : "Buyer"}.

Get started by exploring local sellers and products in your area.

Happy shopping!
The Hometown Marketplace Team
      `;

      const resend = getResendInstance();
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome to Hometown Marketplace!",
        html,
        text,
      });

      logger.info("Resend API response for welcome email", { 
        fullResult: JSON.stringify(result, null, 2),
        hasData: !!result.data,
        hasError: !!result.error,
      });

      if (result.error) {
        logger.error("Resend API returned error", result.error);
        return {
          success: false,
          error: result.error.message || "Resend API error",
        };
      }

      const emailId = result.data?.id || (result as any).id;
      logger.info("Welcome email sent successfully", { 
        email, 
        name, 
        userType,
        emailId: emailId || 'null'
      });
      return { success: true, id: emailId || null };
    } catch (error: any) {
      logger.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }
);

// Send request status email
export const sendRequestStatusEmail = functionsV2.https.onCall(
  { secrets: [resendApiKeySecret] },
  async (request) => {
    const data = request.data;
    const { buyerEmail, buyerName, productName, sellerName, quantity, productPrice, totalPrice, message, status } = data;
    const statusText = status === "approved" ? "approved" : "rejected";
    const statusColor = status === "approved" ? "#689F38" : "#C62828";
    const statusIcon = status === "approved" ? "✓" : "✗";
    const statusEmoji = status === "approved" ? "🎉" : "😔";

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
            <div style="background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 20px; text-align: center;">
                <strong style="color: ${statusColor};">${statusEmoji} ${statusIcon} Your request has been ${statusText}!</strong>
              </p>
            </div>
            
            <div style="background-color: #F5F5F5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="margin-top: 0; color: #D2691E; font-size: 18px;">Request Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Seller:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${sellerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Product:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Quantity:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${quantity}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Price per item:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">$${productPrice.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #ddd;">
                  <td style="padding: 12px 0 8px 0; color: #333;"><strong>Total:</strong></td>
                  <td style="padding: 12px 0 8px 0; text-align: right; font-size: 18px; color: #D2691E;"><strong>$${totalPrice.toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>

            ${message ? `
            <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #E65100;"><strong>Your Message:</strong></p>
              <p style="margin: 8px 0 0 0; color: #5D4037;">"${message}"</p>
            </div>
            ` : ''}

            <div style="margin: 30px 0;">
              ${
                status === "approved"
                  ? `
                  <p style="font-size: 16px; color: ${statusColor};"><strong>✓ Great news!</strong> Your request has been approved by the seller.</p>
                  <p>The seller will coordinate with you to complete the purchase. You can contact them directly through the Hometown Marketplace app.</p>
                  <p style="background-color: #E8F5E9; padding: 15px; border-radius: 4px; color: #2E7D32; margin: 20px 0;">
                    <strong>Next Steps:</strong><br>
                    1. Review your order details above<br>
                    2. Contact the seller to arrange pickup/delivery<br>
                    3. Complete payment as agreed
                  </p>
                  `
                  : `
                  <p style="font-size: 16px; color: ${statusColor};"><strong>Unfortunately, your request could not be approved at this time.</strong></p>
                  <p>This could be due to limited inventory, the item is no longer available, or other circumstances. We encourage you to:</p>
                  <ul style="background-color: #FFEBEE; padding: 20px 20px 20px 40px; border-radius: 4px; color: #C62828; margin: 20px 0;">
                    <li>Browse other products from this seller</li>
                    <li>Try requesting a different quantity</li>
                    <li>Explore similar products from other local sellers</li>
                  </ul>
                  <p>Thank you for using Hometown Marketplace!</p>
                  `
              }
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0; color: #666;">Questions? Reply to this email or visit Hometown Marketplace</p>
              <p style="margin: 10px 0 0 0;">Best regards,<br><strong>The Hometown Marketplace Team</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}

Hi ${buyerName},

Your request has been ${statusText}!

${status === "approved" ? statusEmoji : statusEmoji}

REQUEST DETAILS:
Seller: ${sellerName}
Product: ${productName}
Quantity: ${quantity}
Price per item: $${productPrice.toFixed(2)}
Total: $${totalPrice.toFixed(2)}

${message ? `Your Message: "${message}"\n` : ''}

${
  status === "approved"
    ? `
✓ Great news! Your request has been approved by the seller.

The seller will coordinate with you to complete the purchase. You can contact them directly through the Hometown Marketplace app.

Next Steps:
1. Review your order details above
2. Contact the seller to arrange pickup/delivery
3. Complete payment as agreed
    `
    : `
Unfortunately, your request could not be approved at this time.

This could be due to limited inventory, the item is no longer available, or other circumstances. We encourage you to:
- Browse other products from this seller
- Try requesting a different quantity
- Explore similar products from other local sellers

Thank you for using Hometown Marketplace!
    `
}

Best regards,
The Hometown Marketplace Team
    `;

    try {
      const resend = getResendInstance();
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: buyerEmail,
        subject: `Your request for "${productName}" has been ${statusText}`,
        html,
        text,
      });

      const emailId = result.data?.id || (result as any).id;
      logger.info("Request status email sent successfully", {
        buyerEmail,
        productName,
        status,
        emailId: emailId || 'null',
      });
      return { success: true, id: emailId || null };
    } catch (error: any) {
      logger.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }
);

// Send email to buyer when they create a request
export const sendRequestCreatedEmailToBuyer = functionsV2.https.onCall(
  { secrets: [resendApiKeySecret] },
  async (request) => {
    const data = request.data;
    const buyerEmail = data?.buyerEmail || data?.data?.buyerEmail;
    const buyerName = data?.buyerName || data?.data?.buyerName;
    const sellerName = data?.sellerName || data?.data?.sellerName;
    const productName = data?.productName || data?.data?.productName;
    const quantity = data?.quantity || data?.data?.quantity;
    const productPrice = data?.productPrice || data?.data?.productPrice;
    const totalPrice = data?.totalPrice || data?.data?.totalPrice;
    const message = data?.message || data?.data?.message;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Request Sent Successfully!</h1>
          </div>
          <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
            <p>Hi ${buyerName},</p>
            <p>Your request has been sent successfully! Here are the details:</p>
            <div style="background-color: #FFF8E1; border-left: 4px solid #D2691E; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Seller:</strong> ${sellerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Quantity:</strong> ${quantity}</p>
              <p style="margin: 0 0 10px 0;"><strong>Unit Price:</strong> $${productPrice.toFixed(2)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
              ${message ? `<p style="margin: 10px 0 0 0;"><strong>Your Message:</strong> ${message}</p>` : ''}
            </div>
            <p>The seller will review your request and get back to you soon. You'll receive an email notification when they respond.</p>
            <p style="margin-top: 30px;">Best regards,<br>The Hometown Marketplace Team</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Request Sent Successfully!

Hi ${buyerName},

Your request has been sent successfully! Here are the details:

Product: ${productName}
Seller: ${sellerName}
Quantity: ${quantity}
Unit Price: $${productPrice.toFixed(2)}
Total Price: $${totalPrice.toFixed(2)}
${message ? `Your Message: ${message}` : ''}

The seller will review your request and get back to you soon. You'll receive an email notification when they respond.

Best regards,
The Hometown Marketplace Team
    `;

    try {
      const resend = getResendInstance();
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: buyerEmail,
        subject: `Your request for "${productName}" has been sent`,
        html,
        text,
      });

      const emailId = result.data?.id || (result as any).id;
      logger.info("Request created email sent to buyer", {
        buyerEmail,
        productName,
        emailId: emailId || 'null',
      });
      return { success: true, id: emailId || null };
    } catch (error: any) {
      logger.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }
);

// Send email to seller when they receive a request
export const sendRequestCreatedEmailToSeller = functionsV2.https.onCall(
  { secrets: [resendApiKeySecret] },
  async (request) => {
    const data = request.data;
    const sellerEmail = data?.sellerEmail || data?.data?.sellerEmail;
    const sellerName = data?.sellerName || data?.data?.sellerName;
    const buyerName = data?.buyerName || data?.data?.buyerName;
    const buyerEmail = data?.buyerEmail || data?.data?.buyerEmail;
    const productName = data?.productName || data?.data?.productName;
    const quantity = data?.quantity || data?.data?.quantity;
    const productPrice = data?.productPrice || data?.data?.productPrice;
    const totalPrice = data?.totalPrice || data?.data?.totalPrice;
    const message = data?.message || data?.data?.message;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #D2691E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">New Product Request</h1>
          </div>
          <div style="background-color: #FEFDFB; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #EFEBE9;">
            <p>Hi ${sellerName},</p>
            <p>You have received a new request for one of your products!</p>
            <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Buyer:</strong> ${buyerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Buyer Email:</strong> ${buyerEmail}</p>
              <p style="margin: 0 0 10px 0;"><strong>Quantity:</strong> ${quantity}</p>
              <p style="margin: 0 0 10px 0;"><strong>Unit Price:</strong> $${productPrice.toFixed(2)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
              ${message ? `<p style="margin: 10px 0 0 0;"><strong>Buyer's Message:</strong> ${message}</p>` : ''}
            </div>
            <p>Please review this request in your Hometown Marketplace dashboard and approve or reject it.</p>
            <p style="margin-top: 30px;">Best regards,<br>The Hometown Marketplace Team</p>
          </div>
        </body>
      </html>
    `;

    const text = `
New Product Request

Hi ${sellerName},

You have received a new request for one of your products!

Product: ${productName}
Buyer: ${buyerName}
Buyer Email: ${buyerEmail}
Quantity: ${quantity}
Unit Price: $${productPrice.toFixed(2)}
Total Price: $${totalPrice.toFixed(2)}
${message ? `Buyer's Message: ${message}` : ''}

Please review this request in your Hometown Marketplace dashboard and approve or reject it.

Best regards,
The Hometown Marketplace Team
    `;

    try {
      const resend = getResendInstance();
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: sellerEmail,
        subject: `New request for "${productName}"`,
        html,
        text,
      });

      logger.info("Resend API response for seller email", { 
        fullResult: JSON.stringify(result, null, 2),
        hasData: !!result.data,
        hasError: !!result.error,
        dataId: result.data?.id,
        directId: (result as any).id,
      });

      if (result.error) {
        logger.error("Resend API returned error", result.error);
        return {
          success: false,
          error: result.error.message || "Resend API error",
        };
      }

      const emailId = result.data?.id || (result as any).id;
      logger.info("Request created email sent to seller", {
        sellerEmail,
        productName,
        buyerName,
        emailId: emailId || 'null',
      });
      return { success: true, id: emailId || null };
    } catch (error: any) {
      logger.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }
);
