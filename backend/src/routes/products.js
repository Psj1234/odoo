import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// List Products
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const categoryId = req.query.categoryId;
    const warehouseId = req.query.warehouseId;

    const where = {};
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          stock: warehouseId ? {
            where: {
              location: {
                warehouseId: parseInt(warehouseId)
              }
            },
            include: {
              location: true
            }
          } : {
            include: {
              location: {
                include: {
                  warehouse: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Calculate stock totals
    const productsWithStock = products.map(product => {
      const stockTotal = product.stock.reduce((sum, s) => sum + s.quantity, 0);
      const stockByLocation = product.stock.map(s => ({
        locationId: s.locationId,
        location: s.location.name,
        quantity: s.quantity
      }));

      return {
        ...product,
        stock: {
          total: stockTotal,
          byLocation: stockByLocation
        }
      };
    });

    res.json({
      success: true,
      data: productsWithStock,
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

// Get Product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        stock: {
          include: {
            location: {
              include: {
                warehouse: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const stockTotal = product.stock.reduce((sum, s) => sum + s.quantity, 0);
    const stockByLocation = product.stock.map(s => ({
      locationId: s.locationId,
      location: s.location.name,
      warehouse: s.location.warehouse.code,
      quantity: s.quantity
    }));

    res.json({
      success: true,
      data: {
        ...product,
        stock: {
          total: stockTotal,
          byLocation: stockByLocation
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create Product
router.post('/', async (req, res, next) => {
  try {
    const { sku, name, description, categoryId, unit, reorderPoint } = req.body;

    if (!sku || !name || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'SKU, name, and categoryId are required'
      });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        categoryId: parseInt(categoryId),
        unit: unit || 'pcs',
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : 10
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists'
      });
    }
    next(error);
  }
});

// Update Product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, categoryId, unit, reorderPoint } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(unit && { unit }),
        ...(reorderPoint !== undefined && { reorderPoint: parseInt(reorderPoint) })
      },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    next(error);
  }
});

// Delete Product
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    next(error);
  }
});

export default router;

