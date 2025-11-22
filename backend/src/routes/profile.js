import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// Get Current User
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update Profile
router.put('/', async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Phone number already in use'
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    next(error);
  }
});

export default router;

