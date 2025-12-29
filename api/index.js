// Load environment variables for Vercel serverless functions
// Try backend/.env first (for local), then root .env (for Vercel)
const path = require('path');
const dotenv = require('dotenv');

// Try backend/.env first (local development)
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
// Also try root .env (Vercel or alternative setup)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Export the Express app for Vercel serverless function
const app = require('../backend/server');

// Vercel serverless function handler
module.exports = app;
