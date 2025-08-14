const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const Hospital = require("../relationalModels/hospital");
const User = require("../relationalModels/user");

const Patient = sequelize.define(
  "patient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country:{
      type:DataTypes.STRING,
    },
    ref:{
      type:DataTypes.STRING
    },
    refdetails:{
      type:DataTypes.STRING
    },
    pmobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pregdate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ptitle:{
      type:DataTypes.STRING,
      allowNull:false
    },
    pname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plname:{
      type:DataTypes.STRING
    },
    pgender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    page: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pyears:{
      type:DataTypes.INTEGER
    },
    pmonth:{
      type:DataTypes.INTEGER
    },
    pdays:{
      type:DataTypes.INTEGER
    },
    pblood:{
      type:DataTypes.STRING
    },
    pid:{
      type:DataTypes.STRING
    },
    pidnum:{
      type:DataTypes.STRING
    },
    pwhtsap: {
      type: DataTypes.STRING,
    },
    pemail: {
      type: DataTypes.STRING,
    },
    pguardian: {
      type: DataTypes.STRING,
    },
    pguardianmob:{
      type:DataTypes.INTEGER
    },
    pguardadd:{
      type:DataTypes.STRING
    },
    prltn:{
      type: DataTypes.STRING
    },
    street: {
      type: DataTypes.STRING,
    },
    landmark:{
      type:DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING,
      allowNull:false
    },
    state: {
      type: DataTypes.STRING,
      allowNull:false
    },
    hospitalid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hospital,
        key: "id",
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    registration_status: {
      type: DataTypes.ENUM("Center"),
      allowNull: false,
      defaultValue: "Center",
    },
  },
  {
    timestamps: false,
  }
);




Patient.belongsTo(User, { foreignKey: "created_by" });
User.hasMany(Patient, { foreignKey: "created_by" });


module.exports = Patient;
