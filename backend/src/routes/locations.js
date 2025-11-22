import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// List Locations
router.get('/', async (req, res, next) => {
  try {
    const warehouseId = req.query.warehouseId;

    const where = {};
    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId);
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    next(error);
  }
});

// Get Location by ID
router.get('/:id', async (req, res, next) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        warehouse: true
      }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

// Create Location
router.post('/', async (req, res, next) => {
  try {
    const { warehouseId, name, code, type } = req.body;

    if (!warehouseId || !name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Warehouse, name, and code are required'
      });
    }

    const location = await prisma.location.create({
      data: {
        warehouseId: parseInt(warehouseId),
        name,
        code,
        type: type || 'STORAGE'
      },
      include: {
        warehouse: true
      }
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Location code already exists for this warehouse'
      });
    }
    next(error);
  }
});

// Update Location
router.put('/:id', async (req, res, next) => {
  try {
    const { name, code, type } = req.body;

    const location = await prisma.location.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(type && { type })
      },
      include: {
        warehouse: true
      }
    });

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Location code already exists for this warehouse'
      });
    }
    next(error);
  }
});

// Delete Location
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.location.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    next(error);
  }
});

export default router;

