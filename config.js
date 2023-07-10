const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

module.exports = {
  sendGridApiKey: process.env.SENDGRID_API_KEY,
};