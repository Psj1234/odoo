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

// Get Analytics Data
router.get('/analytics', async (req, res, next) => {
  try {
    const { warehouseId } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Stock Level Overview (by category)
    const stockByCategory = await prisma.stock.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: warehouseId ? {
        location: {
          warehouseId: parseInt(warehouseId)
        }
      } : {}
    });

    const productsWithStock = await prisma.product.findMany({
      where: {
        id: { in: stockByCategory.map(s => s.productId) }
      },
      include: {
        category: true
      }
    });

    const categoryStockMap = {};
    stockByCategory.forEach(stock => {
      const product = productsWithStock.find(p => p.id === stock.productId);
      if (product) {
        const catName = product.category.name;
        categoryStockMap[catName] = (categoryStockMap[catName] || 0) + (stock._sum.quantity || 0);
      }
    });

    const stockLevelOverview = Object.entries(categoryStockMap).map(([name, value]) => ({
      name,
      value: Number(value)
    }));

    // 2. Low Stock Trend (last 30 days) - optimized
    const lowStockTrend = [];
    const lowStockDate = new Date();
    lowStockDate.setDate(lowStockDate.getDate() - 30);
    lowStockDate.setHours(0, 0, 0, 0);

    // Get all low stock items updated in last 30 days
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: { lt: 10 },
        updatedAt: { gte: lowStockDate },
        ...(warehouseId && {
          location: {
            warehouseId: parseInt(warehouseId)
          }
        })
      },
      select: {
        productId: true,
        updatedAt: true
      }
    });

    // Group by date
    const dateMap = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = new Set();
    }

    // Count unique products per day (product was low stock on that day)
    lowStockItems.forEach(item => {
      const itemDate = new Date(item.updatedAt);
      itemDate.setHours(0, 0, 0, 0);
      const dateStr = itemDate.toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].add(item.productId);
      }
    });

    // Convert to array format
    Object.keys(dateMap).sort().forEach(dateStr => {
      lowStockTrend.push({
        date: dateStr,
        count: dateMap[dateStr].size
      });
    });

    // 3. Incoming vs Outgoing Stock (weekly for last 4 weeks)
    const incomingOutgoing = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const receipts = await prisma.receiptItem.aggregate({
        _sum: { quantity: true },
        where: {
          receipt: {
            date: { gte: weekStart, lt: weekEnd },
            status: 'VALIDATED',
            ...(warehouseId && { warehouseId: parseInt(warehouseId) })
          }
        }
      });

      const deliveries = await prisma.deliveryItem.aggregate({
        _sum: { quantity: true },
        where: {
          delivery: {
            date: { gte: weekStart, lt: weekEnd },
            status: 'VALIDATED',
            ...(warehouseId && { warehouseId: parseInt(warehouseId) })
          }
        }
      });

      incomingOutgoing.push({
        week: `Week ${4 - i}`,
        receipts: Number(receipts._sum.quantity || 0),
        deliveries: Number(deliveries._sum.quantity || 0)
      });
    }

    // 4. Stock Distribution by Category
    const categoryDistribution = Object.entries(categoryStockMap).map(([name, value]) => ({
      name,
      value: Number(value)
    }));

    // 5. Warehouse Utilization
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            stock: true
          }
        }
      }
    });

    const warehouseUtilization = warehouses.map(warehouse => {
      const totalCapacity = warehouse.locations.length * 1000; // Assuming capacity per location
      const usedCapacity = warehouse.locations.reduce((sum, loc) => {
        return sum + loc.stock.reduce((s, st) => s + st.quantity, 0);
      }, 0);
      const utilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

      return {
        name: warehouse.name,
        utilization: Math.min(100, Math.round(utilization * 10) / 10)
      };
    });

    // 6. Top Moving Products (from ledger)
    const topMovingProducts = await prisma.ledger.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: {
        date: { gte: thirtyDaysAgo },
        type: { in: ['RECEIPT', 'DELIVERY'] },
        ...(warehouseId && {
          location: {
            warehouseId: parseInt(warehouseId)
          }
        })
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const topProducts = await prisma.product.findMany({
      where: {
        id: { in: topMovingProducts.map(p => p.productId) }
      },
      include: {
        category: true
      }
    });

    const topMoving = topMovingProducts.map(stock => {
      const product = topProducts.find(p => p.id === stock.productId);
      return {
        name: product?.name || 'Unknown',
        value: Math.abs(Number(stock._sum.quantity || 0))
      };
    });

    // 7. Monthly Stock Movements (last 6 months)
    const monthlyMovements = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const receipts = await prisma.receiptItem.aggregate({
        _sum: { quantity: true },
        where: {
          receipt: {
            date: { gte: monthStart, lt: monthEnd },
            status: 'VALIDATED',
            ...(warehouseId && { warehouseId: parseInt(warehouseId) })
          }
        }
      });

      const deliveries = await prisma.deliveryItem.aggregate({
        _sum: { quantity: true },
        where: {
          delivery: {
            date: { gte: monthStart, lt: monthEnd },
            status: 'VALIDATED',
            ...(warehouseId && { warehouseId: parseInt(warehouseId) })
          }
        }
      });

      const adjustments = await prisma.adjustmentItem.aggregate({
        _sum: { difference: true },
        where: {
          adjustment: {
            date: { gte: monthStart, lt: monthEnd },
            ...(warehouseId && { warehouseId: parseInt(warehouseId) })
          }
        }
      });

      monthlyMovements.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        receipts: Number(receipts._sum.quantity || 0),
        deliveries: Number(deliveries._sum.quantity || 0),
        adjustments: Math.abs(Number(adjustments._sum.difference || 0))
      });
    }

    // 8. Adjustment Reasons Breakdown
    const adjustments = await prisma.adjustment.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        ...(warehouseId && { warehouseId: parseInt(warehouseId) })
      },
      select: {
        reason: true
      }
    });

    const reasonCounts = {};
    adjustments.forEach(adj => {
      const reason = adj.reason || 'Other';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const adjustmentReasons = Object.entries(reasonCounts).map(([name, value]) => ({
      name,
      value
    }));

    // 9. Internal Transfer Flow Summary
    const transfers = await prisma.transfer.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        status: 'VALIDATED',
        ...(warehouseId && {
          OR: [
            { fromWarehouseId: parseInt(warehouseId) },
            { toWarehouseId: parseInt(warehouseId) }
          ]
        })
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true
      }
    });

    const transferFlow = {};
    transfers.forEach(transfer => {
      const key = `${transfer.fromWarehouse.code} → ${transfer.toWarehouse.code}`;
      transferFlow[key] = (transferFlow[key] || 0) + 1;
    });

    const transferFlowSummary = Object.entries(transferFlow).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      success: true,
      data: {
        stockLevelOverview,
        lowStockTrend,
        incomingOutgoing,
        categoryDistribution,
        warehouseUtilization,
        topMoving,
        monthlyMovements,
        adjustmentReasons,
        transferFlowSummary
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

