import express from 'express';
import { getDashboardSummary, getCategoryBreakdown, getSpendingTrends } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect); // All analytics routes are protected

router.get('/summary', getDashboardSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/trends', getSpendingTrends);

export default router;
