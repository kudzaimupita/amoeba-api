const serverless = require('serverless-http');
const { app } = require('../../dist/app');
const { connectToDatabase } = require('../../dist/connectDB');
const mongoose = require('mongoose');

let isConnected = false;

const connectToDbHandler = async () => {
  if (!isConnected && mongoose.connection.readyState === 0) {
    try {
      await connectToDatabase();
      isConnected = true;
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      throw new Error(`Database connection error: ${error.message}`);
    }
  }
};

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDbHandler();
  return handler(event, context);
};
