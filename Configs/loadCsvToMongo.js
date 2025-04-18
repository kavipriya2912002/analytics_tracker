import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { loadCSVToMongo } from '../Usecase/analyticsUsecase.js';
dotenv.config();

async function run() {
  const uri = process.env.MONGO;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('analytics');
    const collection = db.collection('analyticsLogs');

    const csvPath = path.join('uploads', 'your-file.csv');
    await loadCSVToMongo(collection, csvPath);

    console.log('CSV data loaded successfully');
  } catch (err) {
    console.error('Error loading CSV:', err);
  } finally {
    await client.close();
  }
}

run();
