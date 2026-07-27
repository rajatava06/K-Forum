import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey && apiKey.startsWith('SG.')) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn('⚠️  SENDGRID_API_KEY is missing or invalid. Emails will not be sent.');
  console.warn('   Add your SendGrid API key (starts with SG.) to server/.env');
}

const fromEmail = process.env.EMAIL_FROM || 'K-Forum <noreply@kforum.online>';

const emailService = {
  /**
   * Send verification OTP email
   */
  async sendVerificationEmail(email, otp) {
    try {
      await sgMail.send({
        to: email,
        from: fromEmail,
        subject: 'K-Forum Email Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17d059;">Welcome to K-Forum!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }
  },

  /**
   * Send re-verification OTP email (for login)
   */
  async sendReVerificationEmail(email, otp) {
    try {
      await sgMail.send({
        to: email,
        from: fromEmail,
        subject: 'K-Forum Email Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17d059;">Email Verification Required</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>Please verify your email to access your account.</p>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending re-verification email:', error);
      return { success: false, error };
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, otp) {
    try {
      await sgMail.send({
        to: email,
        from: fromEmail,
        subject: 'K-Forum Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17d059;">Password Reset Request</h2>
            <p>Your password reset code is:</p>
            <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
  },

  /**
   * Send connection request email notification
   */
  async sendConnectionRequestEmail(targetEmail, targetName, senderName) {
    try {
      await sgMail.send({
        to: targetEmail,
        from: fromEmail,
        subject: `K-Forum: ${senderName} wants to connect with you!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17d059;">New Buddy Connect Request!</h2>
            <p>Hi ${targetName},</p>
            <p><strong>${senderName}</strong> has sent you a connection request on K-Forum.</p>
            <p>Log in to your account to accept or decline the request.</p>
            <div style="margin-top: 20px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
                 style="background-color: #17d059; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Request
              </a>
            </div>
            <p style="margin-top: 20px; color: #888;">If you don't recognize this person, you can ignore this email.</p>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending connection request email:', error);
      return { success: false, error };
    }
  }
};

export default emailService;
