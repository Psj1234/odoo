import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// Get Ledger Entries
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const productId = req.query.productId;
    const warehouseId = req.query.warehouseId;
    const locationId = req.query.locationId;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};
    if (productId) where.productId = parseInt(productId);
    if (locationId) where.locationId = parseInt(locationId);
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (warehouseId) {
      where.location = {
        warehouseId: parseInt(warehouseId)
      };
    }

    const [entries, total] = await Promise.all([
      prisma.ledger.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true
            }
          },
          location: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.ledger.count({ where })
    ]);

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      date: entry.date,
      productId: entry.productId,
      product: entry.product.name,
      productSku: entry.product.sku,
      type: entry.type,
      documentNumber: entry.documentNumber,
      quantity: entry.quantity,
      locationId: entry.locationId,
      location: entry.location.name,
      warehouseId: entry.location.warehouse.id,
      warehouse: entry.location.warehouse.code,
      user: entry.user.name || entry.user.phone,
      notes: entry.notes,
      previousStock: entry.previousStock,
      newStock: entry.newStock,
      createdAt: entry.createdAt
    }));

    res.json({
      success: true,
      data: formattedEntries,
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

export default router;

