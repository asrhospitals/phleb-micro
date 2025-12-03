const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const OPPaymentDetail = sequelize.define(
  "patient_op_payment_detail",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Foreign Key linking this payment to the main bill
    op_bill_id: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patient_op_bills', // name of the OPBill table
        key: 'id',
      }
    },
    // Corresponds to 'Payment Type'
    payment_method: { 
      type: DataTypes.ENUM,
      values: ["Cash", "Credit", "DD", "Cheque", "UPI", "NEFT"],
      defaultValue: "Cash"
    },
    // Corresponds to 'Amount' for this specific payment
    payment_amount: { 
      type: DataTypes.FLOAT,
      allowNull: false
    }
  },
  { timestamps: false }
);

module.exports=OPPaymentDetail;