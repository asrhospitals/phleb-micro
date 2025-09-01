const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const ABHA = sequelize.define(
  "patient_abha",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    isaadhar: { type: DataTypes.BOOLEAN },
    ismobile: { type: DataTypes.BOOLEAN },
    aadhar: { type: DataTypes.BIGINT, unique: true },
    mobile: {
      type: DataTypes.BIGINT,
      validate: { isNumeric: true, len: [10] },
    },
    abha: { type: DataTypes.BIGINT, unique: true },
    patient_id: {
      type: DataTypes.INTEGER,
      references: { model: "patients", key: "id" },
    },
  },
  { timestamps: false }
);
module.exports = ABHA;
