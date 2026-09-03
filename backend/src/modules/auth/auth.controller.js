import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { env } from '../../config/env.js';

export async function signup(request, response) {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: verificationToken
    });

    const verificationLink = `${env.clientOrigin}/verify-email/${verificationToken}`;
    console.log('--- EMAIL VERIFICATION LINK (dev mode) ---');
    console.log(`To: ${email}`);
    console.log(verificationLink);
    console.log('-------------------------------------------');

    return response.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return response.status(500).json({ message: 'Signup failed', error: error.message });
  }
}

export async function verifyEmail(request, response) {
  try {
    const { token } = request.params;

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return response.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return response.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    return response.status(500).json({ message: 'Email verification failed', error: error.message });
  }
}

export async function login(request, response) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
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
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return response.status(500).json({ message: 'Login failed', error: error.message });
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

    const user = await User.findOne({ email });

    // Always return a generic success message, even if the user doesn't exist —
    // this prevents attackers from using this endpoint to check which emails are registered.
    if (!user) {
      return response.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetLink = `${env.clientOrigin}/reset-password/${resetToken}`;
    console.log('--- PASSWORD RESET LINK (dev mode) ---');
    console.log(`To: ${email}`);
    console.log(resetLink);
    console.log('----------------------------------------');

    return response.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.'
    });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to process request', error: error.message });
  }
}

export async function resetPassword(request, response) {
  try {
    const { token } = request.params;
    const { password } = request.body;

    if (!password) {
      return response.status(400).json({ message: 'New password is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return response.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return response.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
}