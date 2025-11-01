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
    const { buyerEmail, buyerName, productName, sellerName, status } = data;
    const statusText = status === "approved" ? "approved" : "rejected";
    const statusColor = status === "approved" ? "#689F38" : "#C62828";
    const statusIcon = status === "approved" ? "✓" : "✗";

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
            ${
              status === "approved"
                ? "<p>Great news! Your request has been approved. You can proceed with the purchase.</p>"
                : "<p>Unfortunately, your request could not be approved at this time. You can try requesting a different product or quantity.</p>"
            }
            <p style="margin-top: 30px;">Best regards,<br>The Hometown Marketplace Team</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}

Hi ${buyerName},

Your request for "${productName}" from ${sellerName} has been ${statusText}.

${
  status === "approved"
    ? "Great news! Your request has been approved. You can proceed with the purchase."
    : "Unfortunately, your request could not be approved at this time."
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
