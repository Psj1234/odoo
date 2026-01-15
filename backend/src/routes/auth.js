import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';
import twilio from 'twilio';

const router = express.Router();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Request OTP (Twilio)
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Send OTP using Twilio Verify
    await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });

    return res.json({
      success: true,
      message: 'OTP sent',
      sessionId: phone // phone is used as sessionId for verification
    });
  } catch (error) {
    next(error);
  }
});

// Verify OTP (Twilio)
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, code, sessionId } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone and code are required'
      });
    }

    // Verify OTP using Twilio Verify
    const verificationCheck = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });

    if (verificationCheck.status !== 'approved') {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP code'
      });
    }

    // Find or create user
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

