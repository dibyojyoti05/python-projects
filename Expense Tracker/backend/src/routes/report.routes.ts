import express from 'express';
import { getExpenseReport, exportReportToCsv } from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/expenses', getExpenseReport);
router.post('/expenses', getExpenseReport);
router.get('/export', exportReportToCsv);
router.post('/export', exportReportToCsv);

export default router;
