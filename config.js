const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

module.exports = {
  sendGridApiKey: process.env.SENDGRID_API_KEY,
  sessionSecret: process.env.SESSION_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY
};