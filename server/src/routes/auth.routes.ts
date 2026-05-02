import { Router } from 'express';
import bcrypt from 'bcrypt';
import sgMail from '@sendgrid/mail';
import User from '../models/User';
import { Workspace, WorkspaceMember } from '../models/Workspace';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { generateOTP, signToken, toPublicUser } from '../utils/auth.utils';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send verification OTP
 */
router.post('/register', asyncHandler(async (req: any, res: any) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new AppError(400, 'Full name, email, and password are required.');
  }

  if (String(password).length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters.');
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) throw new AppError(409, 'An account with this email already exists.');

  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const user = await User.create({
    fullName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    isOnboarded: false,
    isVerified: false,
    otpCode,
    otpExpiresAt,
  });

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    try {
      await sgMail.send({
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
        replyTo: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
        subject: 'Verify your MockVault account',
        html: `<h2>Welcome to MockVault!</h2><p>Your verification code is: <strong>${otpCode}</strong></p><p>This code will expire in 15 minutes.</p>`,
      });
    } catch (sendError: any) {
      console.error('SendGrid Registration Error:', sendError.response?.body || sendError.message);
      // We don't throw here to allow the user to at least be created, they can resend later
    }
  }

  res.status(201).json({ requiresVerification: true, email: user.email });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token or verification prompt
 */
router.post('/login', asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (!user.isVerified) {
    user.otpCode = generateOTP();
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      try {
        await sgMail.send({
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
          replyTo: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
          subject: 'Your MockVault verification code',
          html: `<h2>Welcome back!</h2><p>Your verification code is: <strong>${user.otpCode}</strong></p><p>This code will expire in 15 minutes.</p>`,
        });
      } catch (sendError: any) {
        console.error('SendGrid Login Error:', sendError.response?.body || sendError.message);
      }
    }

    return res.json({ requiresVerification: true, email: user.email });
  }

  res.json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
}));

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify email with OTP code
 */
router.post('/verify-otp', asyncHandler(async (req: any, res: any) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    throw new AppError(400, 'Email and OTP are required.');
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  if (user.isVerified) {
    throw new AppError(400, 'User is already verified.');
  }

  if (user.otpCode !== otp) {
    throw new AppError(400, 'Invalid OTP code.');
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    throw new AppError(400, 'OTP has expired. Please log in again to receive a new code.');
  }

  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  res.json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset OTP
 */
router.post('/forgot-password', asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) throw new AppError(400, 'Email is required.');

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) {
    // Obfuscate user existence
    return res.json({ message: 'If that email exists, a reset code has been sent.' });
  }

  user.otpCode = generateOTP();
  user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    try {
      await sgMail.send({
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
        replyTo: process.env.SENDGRID_FROM_EMAIL || 'balrajbalu2001@gmail.com',
        subject: 'Reset your MockVault Password',
        html: `<h2>Password Reset Request</h2><p>Your password reset code is: <strong>${user.otpCode}</strong></p><p>This code will expire in 15 minutes.</p>`,
      });
    } catch (sendError) {
      console.error('SendGrid Forgot Password Error:', sendError);
    }
  }

  res.json({ message: 'If that email exists, a reset code has been sent.' });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 */
router.post('/reset-password', asyncHandler(async (req: any, res: any) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    throw new AppError(400, 'Email, OTP, and new password are required.');
  }

  if (String(newPassword).length < 8) {
    throw new AppError(400, 'New password must be at least 8 characters.');
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw new AppError(404, 'Invalid request.');

  if (user.otpCode !== otp) {
    throw new AppError(400, 'Invalid OTP code.');
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    throw new AppError(400, 'OTP has expired. Please request a new one.');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.isVerified = true;
  await user.save();

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  const user = await User.findById(req.userId).select('-passwordHash').lean();
  if (!user) throw new AppError(404, 'User not found.');
  res.json(toPublicUser(user));
}));

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 */
router.patch('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  const { fullName, password, currentPassword } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new AppError(404, 'User not found.');

  if (fullName) user.fullName = String(fullName).trim();

  if (password) {
    if (!currentPassword) throw new AppError(400, 'Current password is required.');
    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) throw new AppError(401, 'Current password is incorrect.');
    if (String(password).length < 8) throw new AppError(400, 'New password must be at least 8 characters.');
    user.passwordHash = await bcrypt.hash(password, 12);
  }

  await user.save();
  res.json(toPublicUser(user));
}));

/**
 * @route   POST /api/auth/complete-onboarding
 * @desc    Finalize user onboarding and create default workspace
 */
router.post('/complete-onboarding', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  const { workspaceName } = req.body;
  const user = await User.findByIdAndUpdate(req.userId, { isOnboarded: true }, { new: true });
  if (!user) throw new AppError(404, 'User not found.');

  if (workspaceName) {
    const workspace = await Workspace.create({ name: workspaceName, ownerId: req.userId });
    await WorkspaceMember.create({
      workspaceId: workspace._id.toString(),
      userId: req.userId,
      email: user.email,
      fullName: user.fullName,
      role: 'owner',
    });
  }

  res.json(toPublicUser(user));
}));

export default router;
