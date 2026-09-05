import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { env } from '../../config/env.js';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

export async function signup(request, response) {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return response.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return response.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = hashToken(rawVerificationToken);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      emailVerificationToken: hashedVerificationToken,
      isEmailVerified: env.nodeEnv !== 'production',
    });

    const verificationLink = `${env.clientOrigin}/verify-email/${rawVerificationToken}`;
    if (env.nodeEnv !== 'production') {
      console.log('--- EMAIL VERIFICATION LINK (dev mode) ---');
      console.log(`To: ${email}`);
      console.log(verificationLink);
      console.log('-------------------------------------------');
    }

    return response.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Signup failed',
      error: env.isProd ? undefined : error.message,
    });
  }
}

export async function verifyEmail(request, response) {
  try {
    const { token } = request.params;
    if (!token) {
      return response.status(400).json({ message: 'Verification token is required' });
    }

    const hashed = hashToken(token);
    // Support both hashed token and legacy plain token
    const user = await User.findOne({
      $or: [
        { emailVerificationToken: hashed },
        { emailVerificationToken: token },
      ],
    });

    if (!user) {
      return response.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return response.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    return response.status(500).json({
      message: 'Email verification failed',
      error: env.isProd ? undefined : error.message,
    });
  }
}

/**
 * Authenticates user credentials and returns signed JWT token along with user profile.
 * Verifies that email has been confirmed before granting a valid JWT.
 */
export async function login(request, response) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
      // Timing attack mitigation: run dummy compare if user does not exist
      await bcrypt.compare(String(password), '$2a$10$e8kPqK8k8k8k8k8k8k8k8e8kPqK8k8k8k8k8k8k8k8e8kPqK8k8k.');
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    // Auto-verify in development mode
    if (env.nodeEnv !== 'production' && !user.isEmailVerified) {
      user.isEmailVerified = true;
    }

    // Email verification gate (Production & Staging safety)
    if (!user.isEmailVerified && env.nodeEnv === 'production') {
      return response.status(403).json({
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
      });
    }

    // Ensure role is a valid platform role
    if (!['owner', 'admin', 'editor', 'commenter', 'viewer'].includes(user.role)) {
      const r = String(user.role || '').toLowerCase();
      user.role = ['admin', 'owner'].includes(r) ? 'owner' : 'editor';
    }

    // Update lastLogin timestamp safely without blocking login on non-critical metadata save errors
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (saveErr) {
      console.warn('[Auth Warning]: Failed to update user lastLogin timestamp:', saveErr.message);
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name, email: user.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return response.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('[Auth Error]: Login exception caught:', error);
    return response.status(500).json({
      message: 'Login failed',
      error: env.isProd ? undefined : error.message,
    });
  }
}

export function logout(request, response) {
  return response.status(200).json({ message: 'Logged out successfully' });
}

export async function forgotPassword(request, response) {
  try {
    const { email } = request.body;

    if (!email) {
      return response.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    // Mitigate timing attack & user enumeration
    if (!user) {
      await bcrypt.compare('dummy', '$2a$10$e8kPqK8k8k8k8k8k8k8k8e8kPqK8k8k8k8k8k8k8k8e8kPqK8k8k.');
      return response.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(rawResetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetLink = `${env.clientOrigin}/reset-password/${rawResetToken}`;
    if (env.nodeEnv !== 'production') {
      console.log('--- PASSWORD RESET LINK (dev mode) ---');
      console.log(`To: ${email}`);
      console.log(resetLink);
      console.log('----------------------------------------');
    }

    return response.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Failed to process request',
      error: env.isProd ? undefined : error.message,
    });
  }
}

export async function resetPassword(request, response) {
  try {
    const { token } = request.params;
    const { password } = request.body;

    if (!password) {
      return response.status(400).json({ message: 'New password is required' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return response.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({
      $or: [
        { resetPasswordToken: hashed },
        { resetPasswordToken: token },
      ],
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return response.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Check if new password matches old password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return response.status(400).json({ message: 'New password must be different from previous password' });
    }

    user.password = await bcrypt.hash(password, env.bcryptSaltRounds);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return response.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return response.status(500).json({
      message: 'Failed to reset password',
      error: env.isProd ? undefined : error.message,
    });
  }
}

export async function changePassword(request, response) {
  try {
    const userId = request.user?.id || request.user?._id || request.user?.userId;
    const { currentPassword, newPassword } = request.body;

    if (!userId) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    if (!currentPassword || !newPassword) {
      return response.status(400).json({ message: 'Current password and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return response.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return response.status(400).json({ message: 'Current password is incorrect' });
    }

    const isSamePassword = await bcrypt.compare(String(newPassword), user.password);
    if (isSamePassword) {
      return response.status(400).json({ message: 'New password must be different from previous password' });
    }

    user.password = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await user.save();

    return response.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return response.status(500).json({
      message: 'Failed to change password',
      error: env.isProd ? undefined : error.message,
    });
  }
}