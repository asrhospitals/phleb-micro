const Patient = require("../relationalModels/patient");
const Investigation = require("../relationalModels/investigation");
const PatientTest = require("../relationalModels/patientTests");
const Hospital = require("../relationalModels/hospital");
const OPBill = require("../relationalModels/opBill");
const PPPMode = require("../relationalModels/ppTest");
const ABHA = require("../relationalModels/abha");
const Department = require("../relationalModels/department");
const Result = require("../relationalModels/investigationResult");
const NormalValue = require("../relationalModels/normalValue");

// Associations

// Patient ↔ PatientTest
Patient.hasMany(PatientTest, { foreignKey: "patient_id", as: "patientTests" });
PatientTest.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Investigation ↔ PatientTest
Investigation.hasMany(PatientTest, { foreignKey: "investigation_id",as: "investigationTests",});
PatientTest.belongsTo(Investigation, {foreignKey: "investigation_id",as: "investigation",});

//**Hospital ↔ Investigation (This one might be valid if tests are done at specific hospitals)* */  
// Hospital.hasMany(Investigation, {foreignKey: "hospital_id",as: "hospitalTests",});
// Investigation.belongsTo(Hospital, { foreignKey: "hospital_id", as: "hospital" });

//  Patient ↔ OPBill (ONLY - remove hospital relationship)
Patient.hasMany(OPBill, { foreignKey: "patient_id", as: "patientBills" });
OPBill.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Patient ↔ PPPMode (ONLY - remove hospital relationship)
Patient.hasMany(PPPMode, { foreignKey: "patient_id", as: "patientPPModes" });
PPPMode.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Patient ↔ Hospital
Patient.belongsTo(Hospital, { foreignKey: "hospital_id", as: "hospital" });
Hospital.hasMany(Patient, { foreignKey: "hospital_id", as: "patients" });

//  Patient ↔ ABHA
Patient.hasMany(ABHA, { foreignKey: "patient_id", as: "patientAbhas" });
ABHA.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Patient - Investigation many-to-many via PatientTest
Patient.belongsToMany(Investigation, {
  through: PatientTest,
  foreignKey: "patient_id",
  otherKey: "id",
});
Investigation.belongsToMany(Patient, {
  through: PatientTest,
  foreignKey: "id",
  otherKey: "patient_id",
});

// Investigation - Department
Investigation.belongsTo(Department, { foreignKey: "departmentId" });
Department.hasMany(Investigation, { foreignKey: "departmentId" });

Investigation.hasMany(Result, {
  foreignKey: "investigationId",
  as: "results",
});
Result.belongsTo(Investigation, {
  foreignKey: "investigationId",
  as: "investigation",
});

// 2. Result → NormalValues
Result.hasMany(NormalValue, {
  foreignKey: "resultId",
  as: "normalValues",
});
NormalValue.belongsTo(Result, {
  foreignKey: "resultId",
  as: "result",
});




module.exports = {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
  Department,
  Result,
  NormalValue,
};
