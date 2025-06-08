import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ddmjewellers.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Email verification template
export async function sendVerificationEmail(
  to: string,
  token: string,
  firstName: string
): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured, email verification link:', `${FRONTEND_URL}/verify-email?token=${token}`);
    return true; // Return true for development
  }

  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

  const emailTemplate = {
    to,
    from: FROM_EMAIL,
    subject: 'Verify Your DDM Jewellers Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .welcome { font-size: 18px; color: #333333; margin-bottom: 20px; }
          .message { font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .button:hover { background: linear-gradient(135deg, #b8941f 0%, #e6c200 100%); }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 14px; }
          .security-note { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .security-note p { margin: 0; color: #856404; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DDM Jewellers</h1>
          </div>
          <div class="content">
            <p class="welcome">Welcome ${firstName}!</p>
            <p class="message">
              Thank you for joining DDM Jewellers, your trusted partner in exquisite jewelry. 
              To complete your registration and start exploring our collection, please verify your email address.
            </p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <div class="security-note">
              <p><strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
            </div>
            <p class="message">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #d4af37;">${verificationLink}</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DDM Jewellers. All rights reserved.</p>
            <p>Crafting memories, one jewel at a time.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to DDM Jewellers, ${firstName}!
      
      Thank you for joining us. To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours. If you didn't create this account, please ignore this email.
      
      Best regards,
      DDM Jewellers Team
    `
  };

  try {
    await mailService.send(emailTemplate);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Password reset template
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  firstName: string
): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured, password reset link:', `${FRONTEND_URL}/reset-password?token=${token}`);
    return true; // Return true for development
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const emailTemplate = {
    to,
    from: FROM_EMAIL,
    subject: 'Reset Your DDM Jewellers Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
          .message { font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #ff6b7a 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .button:hover { background: linear-gradient(135deg, #c82333 0%, #e55963 100%); }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 14px; }
          .security-note { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .security-note p { margin: 0; color: #721c24; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DDM Jewellers</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${firstName},</p>
            <p class="message">
              We received a request to reset your password for your DDM Jewellers account. 
              If you made this request, click the button below to create a new password.
            </p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <div class="security-note">
              <p><strong>Security Alert:</strong> This reset link will expire in 24 hours. If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <p class="message">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #dc3545;">${resetLink}</a>
            </p>
            <p class="message">
              For your security, we recommend using a strong password that includes uppercase and lowercase letters, numbers, and special characters.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DDM Jewellers. All rights reserved.</p>
            <p>Your security is our priority.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${firstName},
      
      We received a request to reset your password for your DDM Jewellers account.
      
      If you made this request, click the link below to create a new password:
      ${resetLink}
      
      This link will expire in 24 hours. If you didn't request this reset, please ignore this email and your password will remain unchanged.
      
      For your security, we recommend using a strong password that includes uppercase and lowercase letters, numbers, and special characters.
      
      Best regards,
      DDM Jewellers Security Team
    `
  };

  try {
    await mailService.send(emailTemplate);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  role: string
): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured, welcome email would be sent to:', to);
    return true;
  }

  const dashboardLink = role === 'admin' ? `${FRONTEND_URL}/admin` : 
                       role === 'wholesaler' ? `${FRONTEND_URL}/wholesaler-dashboard` : 
                       `${FRONTEND_URL}/`;

  const emailTemplate = {
    to,
    from: FROM_EMAIL,
    subject: 'Welcome to DDM Jewellers - Your Journey Begins!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DDM Jewellers</title>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .welcome { font-size: 24px; color: #333333; margin-bottom: 20px; text-align: center; }
          .message { font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .features { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features h3 { color: #333333; margin-top: 0; }
          .features ul { margin: 0; padding-left: 20px; }
          .features li { color: #666666; margin-bottom: 8px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DDM Jewellers</h1>
          </div>
          <div class="content">
            <p class="welcome">Welcome, ${firstName}! 🎉</p>
            <p class="message">
              Your email has been verified and your account is now active. We're thrilled to have you join the DDM Jewellers family, where craftsmanship meets elegance.
            </p>
            <div style="text-align: center;">
              <a href="${dashboardLink}" class="button">Start Exploring</a>
            </div>
            <div class="features">
              <h3>What's waiting for you:</h3>
              <ul>
                ${role === 'customer' ? `
                  <li>Exclusive jewelry collections with AI-powered recommendations</li>
                  <li>Virtual try-on with our advanced AR technology</li>
                  <li>Gullak savings program for your dream purchases</li>
                  <li>Loyalty rewards and collectible digital badges</li>
                  <li>Expert jewelry care tutorials and maintenance tracking</li>
                ` : role === 'wholesaler' ? `
                  <li>Wholesale pricing and bulk order management</li>
                  <li>Design upload and approval system</li>
                  <li>Corporate partnership opportunities</li>
                  <li>Priority customer support</li>
                  <li>Advanced analytics and reporting</li>
                ` : `
                  <li>Complete administrative control</li>
                  <li>User and wholesaler management</li>
                  <li>Analytics and business insights</li>
                  <li>Content and inventory management</li>
                  <li>Corporate partnership oversight</li>
                `}
              </ul>
            </div>
            <p class="message">
              Need help getting started? Our support team is here to assist you every step of the way. Feel free to reach out if you have any questions.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DDM Jewellers. All rights reserved.</p>
            <p>Crafting memories, one jewel at a time.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await mailService.send(emailTemplate);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Admin notification for new wholesaler registration
export async function sendWholesalerApprovalNotification(
  adminEmail: string,
  wholesalerData: {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    businessAddress: string;
  }
): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured, admin notification for wholesaler approval');
    return true;
  }

  const emailTemplate = {
    to: adminEmail,
    from: FROM_EMAIL,
    subject: 'New Wholesaler Registration - Approval Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wholesaler Approval Required</title>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">DDM Jewellers Admin</h1>
          </div>
          <div style="padding: 30px;">
            <h2>New Wholesaler Registration</h2>
            <p>A new wholesaler has registered and requires approval:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${wholesalerData.firstName} ${wholesalerData.lastName}</p>
              <p><strong>Email:</strong> ${wholesalerData.email}</p>
              <p><strong>Business Name:</strong> ${wholesalerData.businessName}</p>
              <p><strong>Business Address:</strong> ${wholesalerData.businessAddress}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/admin" style="background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">Review Application</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await mailService.send(emailTemplate);
    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return false;
  }
}