import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { trackFailedAttempt, resetFailedAttempts } from '../middleware/loginRateLimiter';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { mobile, name, gender, homeCity, email, password } = req.body;

    let user = await User.findOne({ mobile });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // New user, register
    user = await User.create({
      mobile,
      email,
      password: hashedPassword,
      isPasswordHashed: !!password,
      name,
      gender,
      homeCity,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;
    
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }

    const user = await User.findOne({ mobile });
    
    // Abstracted away increment attempts
    const handleFailedAttempt = async (identifier: string) => {
      await trackFailedAttempt(identifier);
    };

    if (!user) {
      await handleFailedAttempt(mobile);
      return res.status(401).json({ error: 'Invalid credentials or account locked. Please check your email for recovery options.' });
    }

    if (!user.password) {
      await handleFailedAttempt(user.email || mobile);
      return res.status(401).json({ error: 'Invalid credentials or account locked. Please check your email for recovery options.' });
    }

    // Migration Script: Rehash plain-text/weakly hashed passwords
    let isMatch = false;
    if (!user.isPasswordHashed) {
      // It's a plain-text password or old weak hash. Compare using timingSafeEqual or fallback to simple eq (for plaintext migration)
      isMatch = user.password === password; // In a real scenario, this plain comparison should be carefully done.
      
      if (isMatch) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(password, salt);
        user.isPasswordHashed = true;
        await user.save();
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      await handleFailedAttempt(user.email || mobile);
      return res.status(401).json({ error: 'Invalid credentials or account locked. Please check your email for recovery options.' });
    }

    // Success login - reset attempts
    resetFailedAttempts(user.email || mobile);
    resetFailedAttempts(mobile); // Also clear by mobile just in case
    
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      user: userResponse,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found or password not set' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.isPasswordHashed = true;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      const userResponse = user.toObject();
      delete userResponse.password;
      res.json({ data: userResponse });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
