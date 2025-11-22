import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = express.Router();

router.use(authenticate);

// List Categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get Category by ID
router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        products: {
          take: 10
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// Create Category
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// Update Category
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    next(error);
  }
});

// Delete Category
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.category.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    next(error);
  }
});

export default router;

