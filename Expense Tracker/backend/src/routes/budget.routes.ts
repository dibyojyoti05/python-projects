import express from 'express';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budget.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect); // All budget routes are protected

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .put(updateBudget)
  .delete(deleteBudget);

export default router;
