const sequelize = require("../../db/dbConnection");
const { DataTypes } = require("sequelize");
const Patient = require("../relationalModels/patient");
const Investigation = require("../relationalModels/investigation");
const Hospital = require("../relationalModels/hospital");
const Nodal = require("../relationalModels/nodalMaster");

const PatientTest = sequelize.define("patient_test", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  hospitalid: {
    type: DataTypes.INTEGER,
    references: {
      model: Hospital,
      key: "id",
    },
  },
  nodalid: {
    type: DataTypes.INTEGER,
    references: {
      model: Nodal,
      key: "id",
    },
  },
  patient_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Patient,
      key: "id",
    },
  },

  investigation_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Investigation,
      key: "id",
    },
  },

  rejection_reason: {
    type: DataTypes.STRING,
  },
  test_created_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },

  test_updated_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  test_result: {
    type: DataTypes.STRING,
  },
  test_image: {
    type: DataTypes.STRING,
  },
  h_l_flag: {
    type: DataTypes.ENUM("H", "L", "N", "C"),
  },
  units: {
    type: DataTypes.STRING,
  },
  reference_range: {
    type: DataTypes.STRING,
  },
  critical_range: {
    type: DataTypes.STRING,
  },
  method: {
    type: DataTypes.STRING,
  },
  sample_type: {
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
});

module.exports = PatientTest;
