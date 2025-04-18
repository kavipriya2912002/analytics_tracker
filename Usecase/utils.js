
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
  


  export const calculateCustomerAndOrderStats = async (startDate, endDate) => {
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
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      };
  
      const groupStage = {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalOrders: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customer_id' },
        },
      };
  
      const projectStage = {
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
      };
  
      const pipeline = [matchStage, groupStage, projectStage];
      const cursor = await collection.aggregate(pipeline).toArray();
  
      if (cursor.length === 0) {
        return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, averageOrderValue: 0 };
      }
  
      return cursor[0];
  
    } catch (err) {
      console.error('Error calculating customer and order stats:', err);
      throw err;
    }
  };


  export const calculateProfitMarginByProduct = async (startDate, endDate) => {
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
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      };
  
      const groupStage = {
        $group: {
          _id: '$product_name',
          totalRevenue: { $sum: '$revenue' },
          totalCost: { $sum: '$cost' },
        },
      };
  
      const projectStage = {
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
      };
  
      const pipeline = [matchStage, groupStage, projectStage];
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


  export const refreshAnalyticsData = async (csvPath) => {
    try {
      if (!isConnected) {
        await client.connect();
        isConnected = true;
      }
  
      const db = client.db('analytics');
      const collection = db.collection('analyticsLogs');
  
      // Optional: clear existing data
      const deleteResult = await collection.deleteMany({});
      console.log(`${deleteResult.deletedCount} documents deleted`);
  
      // Load CSV data into MongoDB
      const results = [];
      fs.createReadStream(csvPath)
        .pipe(csvParser())
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