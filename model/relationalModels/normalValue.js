const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const NormalValue = sequelize.define(
  "inv_normalvalue",
  {
    gender: DataTypes.STRING,
    ageMin: DataTypes.INTEGER,
    ageMax: DataTypes.INTEGER,
    rangeMin: DataTypes.FLOAT,
    rangeMax: DataTypes.FLOAT,
    validRangeMin: DataTypes.FLOAT,
    validRangeMax: DataTypes.FLOAT,
    criticalLow: DataTypes.FLOAT,
    criticalHigh: DataTypes.FLOAT,
    isRangeAbnormal: DataTypes.BOOLEAN,
    avoidInReport: DataTypes.BOOLEAN,
    resultId: DataTypes.INTEGER,
  },
  { timestamps: false }
);
module.exports = NormalValue;
