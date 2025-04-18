import { MongoClient } from 'mongodb';
import { calculateRevenueByType } from '../Usecase/utils';
import dotenv from "dotenv";
dotenv.config();

console.log('MONGO URI:', process.env.MONGO);

const uri = process.env.MONGO;
const client = new MongoClient(uri);
let isConnected = false;

export const getRevenue = async (req, res) => {
  try {
    const { from: fromStr, to: toStr, revenue_type: revenueType } = req.query;

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from date format' });
    }

    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid to date format' });
    }

    const result = await calculateRevenueByType(fromDate, toDate, revenueType || 'total');

    return res.status(200).json({
      status: 200,
      message: 'Data fetched successfully',
      data: result
    });

  } catch (error) {
    console.error('Error fetching revenue:', error);
    return res.status(500).json({ error: 'Failed to calculate revenue' });
  }
};
