const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const OPBill = sequelize.define(
  "opbill",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ptotal: {
      type: DataTypes.FLOAT,
    },
    pdisc: {
      type: DataTypes.FLOAT,
    },
    pamt: {
      type: DataTypes.FLOAT,
    },
    pamtrcv: {
      type: DataTypes.FLOAT,
    },
    pamtdue: {
      type: DataTypes.FLOAT,
    },
    pamtmode: {
      type: DataTypes.ENUM,
      values: ["Single", "Multiple"],
    },
    pamtmthd: {
      type: DataTypes.ENUM,
      values: ["Cash", "Credit", "DD", "Cheque", "UPI", "NEFT"],
      defaultValue: "Cash"
    },
    pnote: {
      type: DataTypes.STRING,
    },
    billstatus: {
      type: DataTypes.ENUM,
      values: ["Paid", "Unpaid", "Pending"],
      defaultValue: "Pending"
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hospitalid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = OPBill;
