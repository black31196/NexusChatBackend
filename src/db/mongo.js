// src/db/mongo.js
const mongoose = require('mongoose');

let gfs;

// Check for the required environment variables immediately.
if (!process.env.MONGO_URI || !process.env.MONGO_DB_NAME) {
  throw new Error("FATAL ERROR: MONGO_URI or MONGO_DB_NAME not loaded. Check config/dotenv.js");
}
const connectionString = `${process.env.MONGO_URI}/${process.env.MONGO_DB_NAME}`;

// Create the connection promise ONE time and export it.
const connPromise = mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(mongooseInstance => {
    console.log(`✔️  MongoDB connected to database: "${mongooseInstance.connection.name}"`);
    const db = mongooseInstance.connection.db;
    gfs = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✔️  GridFS initialized.');
    // The promise resolves with the native Db object, which GridFsStorage needs
    return db;
  })
  .catch(error => {
    console.error('❌  MongoDB connection error:', error);
    process.exit(1);
  });

// This function now just makes the main app wait for the connection to finish.
const connectToMongo = async () => {
  await connPromise;
};

const getGfs = () => {
  if (!gfs) throw new Error("GridFS not available. Check DB connection.");
  return gfs;
};

module.exports = {
  connectToMongo,
  getGfs,
  connPromise, // Export the promise for the middleware
};