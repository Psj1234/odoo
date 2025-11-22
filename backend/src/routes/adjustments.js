import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';
import { generateDocumentNumber } from '../utils/generateDocumentNumber.js';

const router = express.Router();

router.use(authenticate);

// List Adjustments
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const warehouseId = req.query.warehouseId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};
    if (warehouseId) where.warehouseId = parseInt(warehouseId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [adjustments, total] = await Promise.all([
      prisma.adjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          warehouse: true,
          items: {
            include: {
              product: true,
              location: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adjustment.count({ where })
    ]);

    res.json({
      success: true,
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Adjustment by ID
router.get('/:id', async (req, res, next) => {
  try {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        error: 'Adjustment not found'
      });
    }

    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
});

// Create Adjustment (AUTOMATION LOGIC - no validation step)
router.post('/', async (req, res, next) => {
  try {
    const { warehouseId, date, reason, items } = req.body;

    if (!warehouseId || !date || !reason || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Warehouse, date, reason, and items are required'
      });
    }

    const documentNumber = await generateDocumentNumber('ADJ', prisma, 'adjustment');

    // AUTOMATION: Update stock and create ledger entries immediately
    const adjustment = await prisma.$transaction(async (tx) => {
      // Create adjustment record
      const adjustment = await tx.adjustment.create({
        data: {
          documentNumber,
          warehouseId: parseInt(warehouseId),
          date: new Date(date),
          reason,
          createdBy: req.userId
        }
      });

      // Process each item
      for (const item of items) {
        const productId = parseInt(item.productId);
        const locationId = parseInt(item.locationId);
        const physicalCount = parseInt(item.physicalCount);

        // Get current stock
        let stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId,
              locationId
            }
          }
        });

        const currentStock = stock?.quantity || 0;
        const difference = physicalCount - currentStock;

        // Create or update stock record
        if (!stock) {
          stock = await tx.stock.create({
            data: {
              productId,
              locationId,
              quantity: physicalCount
            }
          });
        } else {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: physicalCount
            }
          });
        }

        // Create adjustment item record
        await tx.adjustmentItem.create({
          data: {
            adjustmentId: adjustment.id,
            productId,
            locationId,
            currentStock,
            physicalCount,
            difference
          }
        });

        // Create ledger entry
        await tx.ledger.create({
          data: {
            date: adjustment.date,
            productId,
            locationId,
            type: 'ADJUSTMENT',
            documentNumber: adjustment.documentNumber,
            quantity: difference,
            previousStock: currentStock,
            newStock: physicalCount,
            userId: req.userId,
            notes: `Adjustment: ${reason}`
          }
        });
      }

      return adjustment;
    });

    const adjustmentWithDetails = await prisma.adjustment.findUnique({
      where: { id: adjustment.id },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: adjustmentWithDetails
    });
  } catch (error) {
    next(error);
  }
});

export default router;

