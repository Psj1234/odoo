import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';
import { generateDocumentNumber } from '../utils/generateDocumentNumber.js';

const router = express.Router();

router.use(authenticate);

// List Receipts
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const warehouseId = req.query.warehouseId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = parseInt(warehouseId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
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
      prisma.receipt.count({ where })
    ]);

    const receiptsWithTotal = receipts.map(receipt => {
      const total = receipt.items.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.unitPrice)), 0
      );
      return {
        ...receipt,
        total
      };
    });

    res.json({
      success: true,
      data: receiptsWithTotal,
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

// Get Receipt by ID
router.get('/:id', async (req, res, next) => {
  try {
    const receipt = await prisma.receipt.findUnique({
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

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    const total = receipt.items.reduce((sum, item) => 
      sum + (Number(item.quantity) * Number(item.unitPrice)), 0
    );

    res.json({
      success: true,
      data: {
        ...receipt,
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create Receipt
router.post('/', async (req, res, next) => {
  try {
    const { warehouseId, date, notes, items } = req.body;

    if (!warehouseId || !date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Warehouse, date, and items are required'
      });
    }

    const documentNumber = await generateDocumentNumber('REC', prisma, 'receipt');

    const receipt = await prisma.receipt.create({
      data: {
        documentNumber,
        warehouseId: parseInt(warehouseId),
        date: new Date(date),
        notes,
        status: 'PENDING',
        createdBy: req.userId,
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            locationId: parseInt(item.locationId),
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice) || 0
          }))
        }
      },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            location: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
});

// Validate Receipt (AUTOMATION LOGIC)
router.post('/:id/validate', async (req, res, next) => {
  try {
    const receiptId = parseInt(req.params.id);

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        items: true
      }
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    if (receipt.status === 'VALIDATED') {
      return res.status(400).json({
        success: false,
        error: 'Receipt already validated'
      });
    }

    // AUTOMATION: Update stock and create ledger entries
    await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        // Find or create stock record
        let stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId
            }
          }
        });

        if (!stock) {
          stock = await tx.stock.create({
            data: {
              productId: item.productId,
              locationId: item.locationId,
              quantity: 0
            }
          });
        }

        const previousStock = stock.quantity;

        // Update stock: ADD quantity
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        });

        // Create ledger entry
        await tx.ledger.create({
          data: {
            date: receipt.date,
            productId: item.productId,
            locationId: item.locationId,
            type: 'RECEIPT',
            documentNumber: receipt.documentNumber,
            quantity: item.quantity,
            previousStock,
            newStock: previousStock + item.quantity,
            userId: req.userId,
            notes: `Receipt ${receipt.documentNumber} validated`
          }
        });
      }

      // Update receipt status
      await tx.receipt.update({
        where: { id: receiptId },
        data: {
          status: 'VALIDATED',
          validatedBy: req.userId,
          validatedAt: new Date()
        }
      });
    });

    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            location: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Receipt validated successfully',
      data: updatedReceipt
    });
  } catch (error) {
    next(error);
  }
});

export default router;

