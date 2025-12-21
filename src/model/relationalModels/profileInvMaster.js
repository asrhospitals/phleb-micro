const { DataTypes } = require("sequelize");
const sequalize = require("../../db/dbConnection");
const ProfileEntry = require("./profileMaster");

const ProfileInvMaster = sequalize.define(
  "profile_inv_master",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    profileid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ProfileEntry,
        key: "id",
      },
    },
    investigationids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = ProfileInvMaster;
  