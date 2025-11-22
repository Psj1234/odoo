import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';
import { generateDocumentNumber } from '../utils/generateDocumentNumber.js';

const router = express.Router();

router.use(authenticate);

// List Transfers
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const fromWarehouseId = req.query.fromWarehouseId;
    const toWarehouseId = req.query.toWarehouseId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};
    if (status) where.status = status;
    if (fromWarehouseId) where.fromWarehouseId = parseInt(fromWarehouseId);
    if (toWarehouseId) where.toWarehouseId = parseInt(toWarehouseId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: true,
              fromLocation: true,
              toLocation: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transfer.count({ where })
    ]);

    res.json({
      success: true,
      data: transfers,
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

// Get Transfer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true,
            fromLocation: true,
            toLocation: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        validator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
});

// Create Transfer
router.post('/', async (req, res, next) => {
  try {
    const { fromWarehouseId, toWarehouseId, date, notes, items } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'From warehouse, to warehouse, date, and items are required'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination warehouses must be different'
      });
    }

    const documentNumber = await generateDocumentNumber('TRF', prisma, 'transfer');

    const transfer = await prisma.transfer.create({
      data: {
        documentNumber,
        fromWarehouseId: parseInt(fromWarehouseId),
        toWarehouseId: parseInt(toWarehouseId),
        date: new Date(date),
        notes,
        status: 'PENDING',
        createdBy: req.userId,
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            fromLocationId: parseInt(item.fromLocationId),
            toLocationId: parseInt(item.toLocationId),
            quantity: parseInt(item.quantity)
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true,
            fromLocation: true,
            toLocation: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
});

// Validate Transfer (AUTOMATION LOGIC)
router.post('/:id/validate', async (req, res, next) => {
  try {
    const transferId = parseInt(req.params.id);

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    if (transfer.status === 'VALIDATED') {
      return res.status(400).json({
        success: false,
        error: 'Transfer already validated'
      });
    }

    // AUTOMATION: Validate source stock and update both locations
    await prisma.$transaction(async (tx) => {
      // First, validate source stock availability
      for (const item of transfer.items) {
        const sourceStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.fromLocationId
            }
          }
        });

        const availableStock = sourceStock?.quantity || 0;

        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock at source location for ${item.product.sku}. Available: ${availableStock}, Required: ${item.quantity}`
          );
        }
      }

      // Process each item
      for (const item of transfer.items) {
        // Get source stock
        let sourceStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.fromLocationId
            }
          }
        });

        const sourcePreviousStock = sourceStock.quantity;

        // Decrease source stock
        await tx.stock.update({
          where: { id: sourceStock.id },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });

        // Get or create destination stock
        let destStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.toLocationId
            }
          }
        });

        if (!destStock) {
          destStock = await tx.stock.create({
            data: {
              productId: item.productId,
              locationId: item.toLocationId,
              quantity: 0
            }
          });
        }

        const destPreviousStock = destStock.quantity;

        // Increase destination stock
        await tx.stock.update({
          where: { id: destStock.id },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        });

        // Create TWO ledger entries
        // Entry 1: Source (outgoing)
        await tx.ledger.create({
          data: {
            date: transfer.date,
            productId: item.productId,
            locationId: item.fromLocationId,
            type: 'TRANSFER_OUT',
            documentNumber: transfer.documentNumber,
            quantity: -item.quantity,
            previousStock: sourcePreviousStock,
            newStock: sourcePreviousStock - item.quantity,
            userId: req.userId,
            notes: `Transfer ${transfer.documentNumber} - Outgoing`
          }
        });

        // Entry 2: Destination (incoming)
        await tx.ledger.create({
          data: {
            date: transfer.date,
            productId: item.productId,
            locationId: item.toLocationId,
            type: 'TRANSFER_IN',
            documentNumber: transfer.documentNumber,
            quantity: item.quantity,
            previousStock: destPreviousStock,
            newStock: destPreviousStock + item.quantity,
            userId: req.userId,
            notes: `Transfer ${transfer.documentNumber} - Incoming`
          }
        });
      }

      // Update transfer status
      await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: 'VALIDATED',
          validatedBy: req.userId,
          validatedAt: new Date()
        }
      });
    });

    const updatedTransfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true,
            fromLocation: true,
            toLocation: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Transfer validated successfully',
      data: updatedTransfer
    });
  } catch (error) {
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

export default router;

