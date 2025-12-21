const { DataTypes } = require("sequelize");
const sequilize = require("../../db/dbConnection");

const NormalValue = sequilize.define(
  "inv_normalvalue",
  {
    gender: DataTypes.STRING,
    age_min_yyyy: DataTypes.INTEGER,
    age_min_mm:DataTypes.INTEGER,
    age_min_dd:DataTypes.INTEGER,
    age_max_yyyy: DataTypes.INTEGER,
    age_max_mm: DataTypes.INTEGER,
    age_max_dd: DataTypes.INTEGER,
    range_min: DataTypes.FLOAT,
    range_max: DataTypes.FLOAT,
    valid_range_min: DataTypes.FLOAT,
    valid_range_max: DataTypes.FLOAT,
    critical_low: DataTypes.FLOAT,
    critical_high: DataTypes.FLOAT,
    isrange_abnormal: DataTypes.BOOLEAN,
    avoid_in_report: DataTypes.BOOLEAN,
    resultId: DataTypes.INTEGER,
  },
  { timestamps: false }
);
module.exports = NormalValue;
