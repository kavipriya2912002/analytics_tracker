
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
  