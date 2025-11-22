import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// Get Dashboard KPIs
router.get('/kpis', async (req, res, next) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;

    const whereClause = {};
    if (warehouseId) {
      whereClause.warehouseId = parseInt(warehouseId);
    }

    // Total Stock
    const stockQuery = {
      where: {}
    };
    if (warehouseId) {
      stockQuery.where.location = {
        warehouseId: parseInt(warehouseId)
      };
    }

    const totalStock = await prisma.stock.aggregate({
      _sum: {
        quantity: true
      },
      where: warehouseId ? {
        location: {
          warehouseId: parseInt(warehouseId)
        }
      } : {}
    });

    // Low Stock Items (quantity < 10)
    const lowStockItems = await prisma.stock.groupBy({
      by: ['productId'],
      where: {
        quantity: { lt: 10 },
        ...(warehouseId && {
          location: {
            warehouseId: parseInt(warehouseId)
          }
        })
      }
    });

    // Pending Receipts
    const receiptWhere = {
      status: 'PENDING',
      ...whereClause
    };
    if (startDate && endDate) {
      receiptWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const pendingReceipts = await prisma.receipt.count({
      where: receiptWhere
    });

    // Pending Deliveries
    const deliveryWhere = {
      status: 'PENDING',
      ...whereClause
    };
    if (startDate && endDate) {
      deliveryWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const pendingDeliveries = await prisma.delivery.count({
      where: deliveryWhere
    });

    // Pending Transfers
    const transferWhere = {
      status: 'PENDING'
    };
    if (warehouseId) {
      transferWhere.OR = [
        { fromWarehouseId: parseInt(warehouseId) },
        { toWarehouseId: parseInt(warehouseId) }
      ];
    }
    if (startDate && endDate) {
      transferWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const pendingTransfers = await prisma.transfer.count({
      where: transferWhere
    });

    res.json({
      success: true,
      data: {
        totalStock: totalStock._sum.quantity || 0,
        lowStockItems: lowStockItems.length,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Recent Transactions
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent receipts
    const receipts = await prisma.receipt.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentNumber: true,
        date: true,
        status: true,
        warehouse: {
          select: {
            code: true
          }
        }
      }
    });

    // Get recent deliveries
    const deliveries = await prisma.delivery.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentNumber: true,
        date: true,
        status: true,
        warehouse: {
          select: {
            code: true
          }
        }
      }
    });

    // Get recent transfers
    const transfers = await prisma.transfer.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentNumber: true,
        date: true,
        status: true,
        fromWarehouse: {
          select: {
            code: true
          }
        },
        toWarehouse: {
          select: {
            code: true
          }
        }
      }
    });

    // Combine and sort
    const allTransactions = [
      ...receipts.map(r => ({ ...r, type: 'RECEIPT', warehouse: r.warehouse.code })),
      ...deliveries.map(d => ({ ...d, type: 'DELIVERY', warehouse: d.warehouse.code })),
      ...transfers.map(t => ({ ...t, type: 'TRANSFER', warehouse: `${t.fromWarehouse.code}→${t.toWarehouse.code}` }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map(({ warehouse, ...rest }) => rest);

    res.json({
      success: true,
      data: allTransactions
    });
  } catch (error) {
    next(error);
  }
});

export default router;

