import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO;
export const client = new MongoClient(uri);
export let isConnected = false;

// 1. Calculate Revenue by Type
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
        groupStage = { $group: { _id: '$product_name', total: { $sum: '$revenue' } } };
        break;
      case 'category':
        groupStage = { $group: { _id: '$category', total: { $sum: '$revenue' } } };
        break;
      case 'region':
        groupStage = { $group: { _id: '$region', total: { $sum: '$revenue' } } };
        break;
      case 'total':
      default:
        groupStage = { $group: { _id: null, total: { $sum: '$revenue' } } };
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

// 2. Calculate Customer and Order Stats
export const calculateCustomerAndOrderStats = async (startDate, endDate) => {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalOrders: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customer_id' },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: 1,
          totalCustomers: { $size: '$uniqueCustomers' },
          averageOrderValue: {
            $cond: {
              if: { $eq: [{ $ifNull: ['$totalOrders', 0] }, 0] },
              then: 0,
              else: { $divide: ['$totalRevenue', '$totalOrders'] },
            },
          },
        },
      }
    ];

    const cursor = await collection.aggregate(pipeline).toArray();

    return cursor.length ? cursor[0] : {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
    };

  } catch (err) {
    console.error('Error calculating customer and order stats:', err);
    throw err;
  }
};

// 3. Profit Margin by Product
export const calculateProfitMarginByProduct = async (startDate, endDate) => {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: '$product_name',
          totalRevenue: { $sum: '$revenue' },
          totalCost: { $sum: '$cost' },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          profitMargin: {
            $cond: {
              if: { $eq: [{ $ifNull: ['$totalRevenue', 0] }, 0] },
              then: 0,
              else: {
                $divide: [
                  { $subtract: ['$totalRevenue', '$totalCost'] },
                  '$totalRevenue',
                ],
              },
            },
          },
        },
      }
    ];

    const cursor = await collection.aggregate(pipeline).toArray();

    const result = {};
    cursor.forEach((row) => {
      result[row._id] = {
        totalRevenue: row.totalRevenue,
        totalCost: row.totalCost,
        profitMargin: row.profitMargin,
      };
    });

    return result;

  } catch (err) {
    console.error('Error calculating profit margin by product:', err);
    throw err;
  }
};

// 4. Refresh Analytics Data from CSV
export const refreshAnalyticsData = async (csvPath) => {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const deleteResult = await collection.deleteMany({});
    console.log(`${deleteResult.deletedCount} documents deleted`);

    const results = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        try {
          if (results.length > 0) {
            const insertResult = await collection.insertMany(results);
            console.log(`${insertResult.insertedCount} documents inserted`);
          } else {
            console.log('No data found in CSV to insert');
          }
        } catch (err) {
          console.error('Error inserting data into MongoDB:', err);
          throw err;
        }
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        throw err;
      });

  } catch (err) {
    console.error('Error refreshing analytics data:', err);
    throw err;
  }
};

// 5. Load CSV to Mongo (with calculated fields)
export async function loadCSVToMongo(collection, csvPath) {
  return new Promise((resolve, reject) => {
    const docs = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const date = new Date(row['Date of Sale']);
          const quantity = parseInt(row['Quantity Sold'], 10) || 0;
          const unitPrice = parseFloat(row['Unit Price']) || 0;
          const discount = parseFloat(row['Discount']) || 0;
          const shippingCost = parseFloat(row['Shipping Cost']) || 0;

          const revenue = quantity * unitPrice * (1 - discount);
          const cost = quantity * unitPrice * 0.5;

          const doc = {
            order_id: row['Order ID'],
            product_id: row['Product ID'],
            customer_id: row['Customer ID'],
            product_name: row['Product Name'],
            category: row['Category'],
            region: row['Region'],
            date,
            quantity_sold: quantity,
            unit_price: unitPrice,
            discount,
            shipping_cost: shippingCost,
            payment_method: row['Payment Method'],
            customer_name: row['Customer Name'],
            customer_email: row['Customer Email'],
            customer_address: row['Customer Address'],
            revenue,
            cost
          };

          docs.push(doc);
        } catch (error) {
          console.error('Error processing row:', row, error);
        }
      })
      .on('end', async () => {
        try {
          if (docs.length > 0) {
            await collection.insertMany(docs);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
