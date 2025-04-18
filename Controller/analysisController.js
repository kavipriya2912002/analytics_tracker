import { MongoClient } from 'mongodb';
import { calculateRevenueByType } from '../Usecase/utils.js';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

dotenv.config();

console.log('MONGO URI:', process.env.MONGO);

const uri = process.env.MONGO;
const client = new MongoClient(uri);
let isConnected = false;

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

export const uploadCSVMiddleware = upload.single('file');

export const uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', req.file.filename);

  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push({
          ...row,
          revenue: parseFloat(row.revenue || 0),
          date: new Date(row.date),
        });
      })
      .on('end', async () => {
        if (results.length > 0) {
          await collection.insertMany(results);
        }

        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'CSV uploaded and processed successfully' });
      })
      .on('error', (error) => {
        console.error('CSV processing error:', error);
        res.status(500).json({ error: 'Failed to process CSV' });
      });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


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
