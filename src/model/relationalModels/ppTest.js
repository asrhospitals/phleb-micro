const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const PPModeTest = sequelize.define(
  "patient_ppp",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    pop: { type: DataTypes.STRING },
    popno: { type: DataTypes.STRING, unique: true },
    pscheme: { type: DataTypes.STRING },
    refdoc: { type: DataTypes.STRING },
    pbarcode: { type: DataTypes.STRING, allowNull: false, unique: true },
    trfno: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    remark: { type: DataTypes.STRING, allowNull: false },
    attatchfile: { type: DataTypes.STRING },
    pid: { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: false }
);

module.exports = PPModeTest;
