import express from 'express';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

const router = express.Router();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Request OTP
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
      });
    }

    // For development/testing, skip Twilio if not configured
    if (!process.env.TWILIO_VERIFY_SERVICE_SID || process.env.NODE_ENV === 'development') {
      // Mock OTP for development
      return res.json({
        success: true,
        message: 'OTP sent successfully (dev mode: use 123456)',
        sessionId: 'dev_session_' + Date.now()
      });
    }

    // Send OTP via Twilio
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      sessionId: verification.sid
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

    // For development/testing
    if (!process.env.TWILIO_VERIFY_SERVICE_SID || process.env.NODE_ENV === 'development') {
      if (code === '123456') {
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { phone }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              name: 'User',
              role: 'WAREHOUSE_STAFF'
            }
          });
        }

        const token = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid OTP code'
        });
      }
    }

    // Verify OTP via Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phone, code });

    if (!verificationCheck.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP code'
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: 'User',
          role: 'WAREHOUSE_STAFF'
        }
      });
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

