const sequelize = require("../../db/dbConnection");
const { DataTypes } = require("sequelize");
const Patient=require("../relationalModels/patient");
const Investigation=require("../relationalModels/investigation");
const Hospital=require("../relationalModels/hospital");


const PatientTest = sequelize.define("patienttests", {
  patient_test_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  patient_id: {
  type: DataTypes.INTEGER,
  references: {
    model: Patient,
    key: 'id'
  }
},
investigation_id: {
  type: DataTypes.INTEGER,
  references: {
    model: Investigation,
    key: 'id'
  }
},
hospitalid: {
  type: DataTypes.INTEGER,
  references: {
    model: Hospital,
    key: 'id'
  }
},

  rejection_reason: { 
    type: DataTypes.STRING,
  },
  test_created_date:{
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },

  test_updated_date:{
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
/// Need to add Some validation for test result
  test_result:{
    type: DataTypes.FLOAT,
  },
  test_image:{
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM( 
      "collected",  
      "node",
      "center",
      "motherlab",
      "technician",
      "doctor",
      "pending",
      "accept", 
      "redo",
      "reject",
      "recollect",
      "docpending",
      "completed",
      "inprogress",
      "delivered"
    ),
    allowNull: false,
    defaultValue: "center",
  },
  
},{
  timestamps: false,
});





module.exports = PatientTest;
