const { MongoClient } = require('mongodb');

let client;

async function connectToMongoDB() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');
}

function getDB() {
  if (!client) {
    throw new Error('MongoDB client not connected. Call connectToMongoDB first.');
  }
  return client.db();
}

module.exports = { connectToMongoDB, getDB };
