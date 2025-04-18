import fs from "fs";
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
  