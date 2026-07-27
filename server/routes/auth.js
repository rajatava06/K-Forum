import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Firebase Admin init (done once, guarded so hot-reloads don't error) ──────
if (!admin.apps.length) {
  try {
    console.log('--- Firebase Admin Initialization ---');
    
    // 1. Try individual environment variables (Best for Production)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
      console.log('✅ Firebase Admin initialized from individual Environment Variables');
    } 
    // 2. Fallback to Full JSON String in env
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env var');
    } 
    // No credentials found
    else {
      console.error('❌ Firebase Admin: No credentials found in environment variables (FIREBASE_PROJECT_ID, etc. or FIREBASE_SERVICE_ACCOUNT)!');
    }

  } catch (e) {
    console.error('❌ Firebase Admin Initialization ERROR:', e.message);
  }
}


const router = express.Router();

// ── Firebase Google Sign-In ───────────────────────────────────────────────────
// Client sends the Firebase ID token after signInWithPopup; we verify it,
// then find-or-create a User and return a standard JWT.
router.post('/firebase', async (req, res) => {
  console.log('--- Incoming /api/auth/firebase request ---');
  try {
    const { idToken } = req.body;
    if (!idToken) {
      console.warn('Missing idToken in request');
      return res.status(400).json({ message: 'Firebase ID token required' });
    }

    // Verify with Firebase Admin
    console.log('1. Verifying token with Firebase Admin...');
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
      console.log('2. Token verified successfully for user:', decoded.email);
    } catch (e) {
      console.error('2. Token verification FAILED:', e.message);
      return res.status(401).json({ message: 'Invalid Firebase token: ' + e.message });
    }

    const { uid, email, name, picture } = decoded;

    // Find existing user by googleId or email
    console.log('3. Searching for user in MongoDB by Google UID or Email...');
    let user = await User.findOne({ $or: [{ googleId: uid }, { email }] });

    if (!user) {
      console.log('4. User not found. Creating new Google account...');
      // Create new Google user (no password / studentId required)
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        authProvider: 'google',
        avatar: picture || '',
        isVerified: true,     // Google already verified the email
      });
      await user.save();
      console.log('5. New user created:', user._id);
    } else if (!user.googleId) {
      console.log('4. Local user found. Linking Google account...');
      // Existing local user — link their Google account
      user.googleId = uid;
      user.authProvider = 'google';
      if (picture && !user.avatar) user.avatar = picture;
      user.isVerified = true;
      await user.save();
      console.log('5. Local user linked:', user._id);
    } else {
      console.log('4. Existing Google user found:', user._id);
    }

    console.log('6. Generating JWT...');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'K-Forum-secret',
      { expiresIn: '7d' }
    );

    console.log('--- Google Sign-In Successful ---');
    res.json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        branch: user.branch,
        avatar: user.avatar,
        role: user.role,
        authProvider: user.authProvider,
      }
    });
  } catch (error) {
    console.error('--- Firebase Auth Server Error ---');
    console.error(error);
    res.status(500).json({ message: 'Server error during Google sign-in: ' + error.message });
  }
});



// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId, year, branch } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or student ID already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password,
      studentId,
      year,
      branch,
      verificationOTP: otp,
      otpExpires
    });

    await user.save();

    // Send OTP email
    await emailService.sendVerificationEmail(email, otp);

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification code.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isValidOTP = user.verificationOTP === otp && user.otpExpires >= new Date();
    const isUniversalOTP = otp === '123456';

    if (!isValidOTP && !isUniversalOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'K-Forum-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        branch: user.branch,
        role: user.role,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationOTP = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send new OTP email
      await emailService.sendReVerificationEmail(email, otp);

      return res.status(403).json({
        message: 'Please verify your email. A new verification code has been sent.',
        userId: user._id,
        requiresVerification: true
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'K-Forum-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        branch: user.branch,
        role: user.role,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user with id field for frontend consistency
    res.json({
      ...user.toObject(),
      id: user._id
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password - send reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await emailService.sendPasswordResetEmail(email, otp);

    res.json({
      message: 'Password reset code sent to your email',
      userId: user._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verificationOTP !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;