// src/db/mongo.js
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.mongodb')
});

let client;
async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    console.log('✔️ MongoDB connected');
  }
  return client.db(process.env.MONGO_DB_NAME);
}
async function closeMongo() {
  if (client) await client.close();
}

module.exports = { connectToMongo, closeMongo };
