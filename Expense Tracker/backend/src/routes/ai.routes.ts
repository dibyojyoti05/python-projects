import express from 'express';
import { parseExpenseWithAI } from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/parse-expense', parseExpenseWithAI);

export default router;
