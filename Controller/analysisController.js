import { MongoClient } from 'mongodb';
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

export const calculateRevenueByType = async (fromDate, toDate, revenueType = 'total') => {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const matchStage = {
      $match: {
        date: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      },
    };

    let groupStage;
    switch (revenueType) {
      case 'product':
        groupStage = {
          $group: {
            _id: '$product_name',
            total: { $sum: '$revenue' },
          },
        };
        break;
      case 'category':
        groupStage = {
          $group: {
            _id: '$category',
            total: { $sum: '$revenue' },
          },
        };
        break;
      case 'region':
        groupStage = {
          $group: {
            _id: '$region',
            total: { $sum: '$revenue' },
          },
        };
        break;
      case 'total':
      default:
        groupStage = {
          $group: {
            _id: null,
            total: { $sum: '$revenue' },
          },
        };
        break;
    }

    const pipeline = [matchStage, groupStage];
    const cursor = await collection.aggregate(pipeline).toArray();

    if (revenueType === 'total' || !revenueType) {
      return cursor.length ? cursor[0] : { total: 0 };
    }

    const result = {};
    cursor.forEach((row) => {
      result[row._id] = row.total;
    });

    return result;

  } catch (err) {
    console.error('Error in calculateRevenueByType:', err);
    throw err;
  }
};
