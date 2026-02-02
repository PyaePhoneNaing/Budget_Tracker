import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
];

router.use(authenticateToken);

router.get('/', getCategories);
router.post('/', categoryValidation, createCategory);
router.put('/:id', categoryValidation, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
