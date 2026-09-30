import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/mailer.js';

const router = express.Router();

// Helper to generate a 6-digit random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    email = email.trim().toLowerCase();
    name = name.trim();

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email already registered. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role || 'owner';
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'owner',
        isVerified: false
      });
    }

    // Generate & store OTP
    const otpCode = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp: otpCode });

    // Send OTP email
    try {
      await sendOTPEmail(email, otpCode);
    } catch (mailErr) {
      console.error('Failed to send OTP email:', mailErr);
      return res.status(500).json({ message: 'Account created, but failed to send verification email. Please check EMAIL_USER and EMAIL_PASS configuration.' });
    }

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'Verification code sent to your email.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please check or resend code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ email });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('OTP Verification error:', err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please sign in.' });
    }

    const otpCode = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp: otpCode });

    await sendOTPEmail(email, otpCode);

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: err.message || 'Failed to resend code' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const otpCode = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp: otpCode });

    try {
      await sendPasswordResetEmail(email, otpCode);
    } catch (mailErr) {
      console.error('Failed to send password reset email:', mailErr);
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
    }

    res.json({ message: 'A 6-digit password reset code has been sent to your email.' });
  } catch (err) {
    console.error('Forgot Password error:', err);
    res.status(500).json({ message: err.message || 'Failed to process request' });
  }
});

router.post('/verify-reset-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please check or request a new code.' });
    }

    res.json({ message: 'Code verified successfully. Please enter your new password.' });
  } catch (err) {
    console.error('Verify Reset OTP error:', err);
    res.status(500).json({ message: err.message || 'OTP verification failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required.' });
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please check or request a new code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ email });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset Password error:', err);
    res.status(500).json({ message: err.message || 'Password reset failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      const otpCode = generateOTP();
      await OTP.deleteMany({ email });
      await OTP.create({ email, otp: otpCode });
      try {
        await sendOTPEmail(email, otpCode);
      } catch (mailErr) {
        console.error('Failed to send OTP during login:', mailErr);
      }

      return res.status(403).json({
        requiresVerification: true,
        email,
        message: 'Your account is not verified yet. A new verification code has been sent to your email.'
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

export default router;