import express from "express";
import {
  getRevenue,
  uploadCSV,
  uploadCSVMiddleware,
  refreshData,
  getCustomerAndOrderStats,
  getProfitMarginByProduct
} from "../Controller/analysisController.js";

const router = express.Router();

router.post('/upload', uploadCSVMiddleware, uploadCSV);

router.get('/revenue', getRevenue);

router.post('/refresh', refreshData);

router.get('/customer-order-stats', getCustomerAndOrderStats);

router.get('/profit-margin', getProfitMarginByProduct);

export default router;
