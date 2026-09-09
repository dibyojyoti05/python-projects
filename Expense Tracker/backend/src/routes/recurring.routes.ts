import express from 'express';
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  triggerProcessRecurring
} from '../controllers/recurring.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getRecurringExpenses);
router.post('/', createRecurringExpense);
router.post('/process', triggerProcessRecurring);
router.put('/:id', updateRecurringExpense);
router.delete('/:id', deleteRecurringExpense);

export default router;
