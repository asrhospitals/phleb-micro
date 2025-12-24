const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const Hospital = require("../relationalModels/hospital");
const Nodal = require("../relationalModels/nodalMaster");

const Patient = sequelize.define(
  "patient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    u_name:{
      type:DataTypes.STRING
    },
    country:{
      type:DataTypes.STRING,
    },
    ref_source:{
      type:DataTypes.STRING
    },
    ref_details:{
      type:DataTypes.STRING
    },
    p_mobile: {
      type: DataTypes.STRING,
   
      allowNull: false,
    },
    p_regdate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // p_regtime:{
    //   type:DataTypes.TIME,
    //   allowNull:false,
    // },
    p_title:{
      type:DataTypes.STRING,
      allowNull:false
    },
    p_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    p_lname:{
      type:DataTypes.STRING
    },
    p_gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    p_age: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    p_years:{
      type:DataTypes.INTEGER
    },
    p_month:{
      type:DataTypes.INTEGER
    },
    p_days:{
      type:DataTypes.INTEGER
    },
    p_blood:{
      type:DataTypes.STRING
    },
    p_id:{
      type:DataTypes.STRING
    },
    p_idnum:{
      type:DataTypes.STRING
    },
    p_whtsap: {
      type: DataTypes.STRING,
    
    },
    p_email: {
      type: DataTypes.STRING,
    },
    p_image:{
      type:DataTypes.STRING
    },
    p_guardian: {
      type: DataTypes.STRING,
    },
    p_guardianmob:{
      type:DataTypes.STRING,
      maxlength:10
    },
    p_guardadd:{
      type:DataTypes.STRING
    },
    p_rltn:{
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
    },
    p_pincode: {
      type: DataTypes.STRING,
  
    },
    hospitalid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hospital,
        key: "id",
      },
    },

    nodalid:{
      type:DataTypes.INTEGER,
      references:{
        model:Nodal,
        key:"id"
      }
    },

    reg_by: {
      type: DataTypes.ENUM("Node", "Center"),
      defaultValue: "Center",
    },
    uhid:{
      type: DataTypes.STRING,
      unique: true,
    },
    p_whtsap_alart:{
      type:DataTypes.BOOLEAN,
    },
    p_email_alart:{
      type:DataTypes.BOOLEAN,
    },
  },
);






module.exports = Patient;
