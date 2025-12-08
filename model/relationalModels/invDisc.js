const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const InvDetail = sequelize.define(
  "patient_inv_details",
  {
    // 1. Primary Key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 2. Foreign Key to the main bill (Header)
    op_bill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "patient_op_bills", // name of the OPBill table
        key: "id",
      },
    },

    // 3. Foreign Key to the specific investigation (Test/Service)
    inv_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "investigations", // The master table for tests
        key: "id",
      },
    },

    // 4. Line Item Pricing Details (CRITICAL for correct billing)
    // Store the price at the time of billing to ensure historical accuracy
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // 5. Discount Fields (Corrected Names)
    // Total discount AMOUNT applied to this line item
    discount_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },

    // Discount PERCENTAGE applied to this line item (optional if only amount is used)
    discount_percentage: {
      type: DataTypes.FLOAT, // Use FLOAT for percentage (e.g., 10.5)
      defaultValue: 0.0,
    },

    // Amount After Discount applied
    final_amount: {
      type: DataTypes.FLOAT, // Use FLOAT for percentage (e.g., 10.5)
      defaultValue: 0.0,
    },
  },
  {
    timestamps: false, // Assuming you don't need createdAt/updatedAt
    tableName: "patient_inv_details", // Use a clear table name
  }
);

module.exports = InvDetail;
