// src/db/mongo.js
const mongoose = require('mongoose');
const path = require('path');


// Build the connection string
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

console.log(`[Mongo Connection] Attempting to connect to database: "${dbName}"`);

const connectionString = `${mongoUri}/${dbName}`;


let gfs;

// Mongoose connection logic
const connectToMongo = async () => {
  // Check if we have a connection to the database
  if (mongoose.connection.readyState >= 1) {
    console.log('✔️  MongoDB connection already established.');
    return;
  }

  try {
    // Mongoose's connect method returns a promise
    await mongoose.connect(connectionString, {
      // These options are now defaults in recent Mongoose versions,
      // but are good to be aware of.
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    console.log('✔️  MongoDB connected successfully.');
  } catch (error) {
    console.error('❌  MongoDB connection error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

const closeMongo = async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
};

const getGfs = () => {
    if (!gfs) {
        throw new Error("GridFS not initialized. Call connectToMongo first.");
    }
    return gfs;
}

module.exports = { connectToMongo, closeMongo, getGfs };