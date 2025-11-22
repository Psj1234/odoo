import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

const router = express.Router();

// Request OTP
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Skip external OTP providers for now — always respond success.
    return res.json({
      success: true,
      message: 'OTP sent (mock)',
      sessionId: 'mock_session_' + Date.now()
    });
  } catch (error) {
    next(error);
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, code, sessionId } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone and code are required'
      });
    }

    // Accept any OTP code for now — bypass external verification.
    // Find or create user. If Prisma/DB isn't available, fall back to a mock user.
    let user;
    try {
      user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            name: 'User',
            role: 'WAREHOUSE_STAFF'
          }
        });
      }
    } catch (dbError) {
      console.warn('Prisma DB error in verify-otp, returning mock user:', dbError.message);
      user = {
        id: 'dev_' + Date.now(),
        phone,
        name: 'User',
        role: 'WAREHOUSE_STAFF'
      };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

