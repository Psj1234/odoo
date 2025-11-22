import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';
import { generateDocumentNumber } from '../utils/generateDocumentNumber.js';

const router = express.Router();

router.use(authenticate);

// List Deliveries
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

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
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
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.delivery.count({ where })
    ]);

    const deliveriesWithTotal = deliveries.map(delivery => {
      const total = delivery.items.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.unitPrice)), 0
      );
      return {
        ...delivery,
        total
      };
    });

    res.json({
      success: true,
      data: deliveriesWithTotal,
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

// Get Delivery by ID
router.get('/:id', async (req, res, next) => {
  try {
    const delivery = await prisma.delivery.findUnique({
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

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }

    const total = delivery.items.reduce((sum, item) => 
      sum + (Number(item.quantity) * Number(item.unitPrice)), 0
    );

    res.json({
      success: true,
      data: {
        ...delivery,
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create Delivery
router.post('/', async (req, res, next) => {
  try {
    const { warehouseId, date, customerName, notes, items } = req.body;

    if (!warehouseId || !date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Warehouse, date, and items are required'
      });
    }

    const documentNumber = await generateDocumentNumber('DEL', prisma, 'delivery');

    const delivery = await prisma.delivery.create({
      data: {
        documentNumber,
        warehouseId: parseInt(warehouseId),
        date: new Date(date),
        customerName,
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
      data: delivery
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Delivery with this document number already exists'
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Invalid warehouse, product, or location ID'
      });
    }
    next(error);
  }
});

// Validate Delivery (AUTOMATION LOGIC)
router.post('/:id/validate', async (req, res, next) => {
  try {
    const deliveryId = parseInt(req.params.id);

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }

    if (delivery.status === 'VALIDATED') {
      return res.status(400).json({
        success: false,
        error: 'Delivery already validated'
      });
    }

    // AUTOMATION: Validate stock availability and update stock
    await prisma.$transaction(async (tx) => {
      // First, validate stock availability
      for (const item of delivery.items) {
        const stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId
            }
          }
        });

        const availableStock = stock?.quantity || 0;

        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.product.sku}. Available: ${availableStock}, Required: ${item.quantity}`
          );
        }
      }

      // If all items have sufficient stock, proceed with updates
      for (const item of delivery.items) {
        const stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId
            }
          }
        });

        const previousStock = stock.quantity;

        // Update stock: SUBTRACT quantity
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });

        // Create ledger entry
        await tx.ledger.create({
          data: {
            date: delivery.date,
            productId: item.productId,
            locationId: item.locationId,
            type: 'DELIVERY',
            documentNumber: delivery.documentNumber,
            quantity: -item.quantity,
            previousStock,
            newStock: previousStock - item.quantity,
            userId: req.userId,
            notes: `Delivery ${delivery.documentNumber} validated`
          }
        });
      }

      // Update delivery status
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'VALIDATED',
          validatedBy: req.userId,
          validatedAt: new Date()
        }
      });
    });

    const updatedDelivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
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
      message: 'Delivery validated successfully',
      data: updatedDelivery
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

