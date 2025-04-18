
import express from "express";
import { getRevenue } from "../Controller/analysisController.js";

const router = express.Router();

router.get('/revenue', getRevenue);

export default router;
