const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const OPBill = sequelize.define(
  "patient_op_bill",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Corresponds to 'Total' in the image
    ptotal: {
      type: DataTypes.FLOAT,
    },
    // Corresponds to 'Discount(%)' in the image (percentage value)
    pdisc_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    // Corresponds to 'Discount' in the image (absolute amount)
    pdisc_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    // Corresponds to 'Amount Receivable'
    pamt_receivable: {
      type: DataTypes.FLOAT,
    },
    // Corresponds to 'Amount Received' (Sum of all individual payments)
    pamt_received_total: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    // Calculated: Amount Receivable - Amount Received Total
    pamt_due: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    // Corresponds to 'Payment Mode' (Single / Multiple)
    pamt_mode: {
      type: DataTypes.ENUM,
      values: ["Single", "Multiple"],
    },
    // Corresponds to 'Additional Note'
    pnote: {
      type: DataTypes.STRING,
    },
    billstatus: {
      type: DataTypes.ENUM,
      values: ["Paid", "Unpaid", "Due"],
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    invDetails:{
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Foreign key to the Patient table
    pid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Additional fields from the image that don't need a new table
    review_status: {
      type: DataTypes.STRING, // For 'Review' input
    },
    review_days: {
      type: DataTypes.INTEGER, // For 'Days' input
    },
    bill_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
  },
},
);

module.exports = OPBill;
