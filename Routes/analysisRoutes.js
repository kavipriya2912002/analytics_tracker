
import express from "express";
import { getRevenue } from "../Controller/analysisController.js";
import { uploadCSV,uploadCSVMiddleware } from "../Controller/analysisController.js";

const router = express.Router();

router.post('/upload', uploadCSVMiddleware, uploadCSV);
router.get('/revenue', getRevenue);

export default router;
