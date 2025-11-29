const { DataTypes } = require("sequelize");
const sequalize = require("../../db/dbConnection");


const ProfileMaster = sequalize.define(
  "profile_master",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    profilename: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },
    profilecode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },
    alternativebarcode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);



module.exports = ProfileMaster;
