const { DataTypes } = require('sequelize');
const sequelize = require('../../db/dbConnection');

const DeparmentMaster = sequelize.define('department', {

  id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dptname: {
    type: DataTypes.STRING,
    allowNull: false,
    unique:true
  },
  isactive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue:true
  },
},{timestamps:false});

module.exports = DeparmentMaster;