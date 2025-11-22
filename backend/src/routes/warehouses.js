import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// List Warehouses
router.get('/', async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: true,
        _count: {
          select: {
            receipts: true,
            deliveries: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
});

// Get Warehouse by ID
router.get('/:id', async (req, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        locations: true
      }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
});

// Create Warehouse
router.post('/', async (req, res, next) => {
  try {
    const { name, code, address, phone } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Name and code are required'
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        phone
      }
    });

    res.status(201).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Warehouse code already exists'
      });
    }
    next(error);
  }
});

// Update Warehouse
router.put('/:id', async (req, res, next) => {
  try {
    const { name, code, address, phone } = req.body;

    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone })
      }
    });

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Warehouse code already exists'
      });
    }
    next(error);
  }
});

// Delete Warehouse
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.warehouse.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
    }
    next(error);
  }
});

export default router;

