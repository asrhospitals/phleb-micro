// src/services/transporter.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // Example using common configuration (e.g., for a corporate SMTP or Gmail/Outlook/SendGrid)
  host: process.env.EMAIL_HOST,       // e.g., 'smtp.office365.com' or 'smtp.gmail.com'
  port: process.env.EMAIL_PORT,       // e.g., 587 (for TLS) or 465 (for SSL)
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }


});

module.exports = transporter;
