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
const Nodal = require("../relationalModels/nodalMaster");
const ProfileInv = require("../relationalModels/profileInvMaster");
const ProfileMaster = require("../relationalModels/profileMaster");

// Associations

// Patient ↔ PatientTest
Patient.hasMany(PatientTest, { foreignKey: "patient_id", as: "patientTests" });
PatientTest.belongsTo(Patient, { foreignKey: "patient_id", as: "patient",targetKey:'id' });

//  Investigation ↔ PatientTest
Investigation.hasMany(PatientTest, { foreignKey: "investigation_id",as: "investigationTests",});
PatientTest.belongsTo(Investigation, {foreignKey: "investigation_id",as: "investigation",});


//  Patient ↔ OPBill (ONLY - remove hospital relationship)
Patient.hasMany(OPBill, { foreignKey: "patient_id", as: "patientBills" });
OPBill.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Patient ↔ PPPMode (ONLY - remove hospital relationship)
Patient.hasMany(PPPMode, { foreignKey: "patient_id", as: "patientPPModes" });
PPPMode.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

//  Patient ↔ Hospital
Patient.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });
Hospital.hasMany(Patient, { foreignKey: "hospitalid", as: "patients" });

//  Patient ↔ Nodal
Patient.belongsTo(Nodal, { foreignKey: "nodalid", as: "nodal" });
Nodal.hasMany(Patient, { foreignKey: "nodalid", as: "patients" });

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

// Profile associations
ProfileInv.belongsTo(ProfileMaster, {
  foreignKey: "profileid",
  as: "profile", // singular
});

ProfileMaster.hasMany(ProfileInv, {
  foreignKey: "profileid",
  as: "profileInvs", // plural
});

// ProfileInv → Investigation
ProfileInv.belongsTo(Investigation, {
  foreignKey: "investigationids",   // column in ProfileInv that points to Investigation.id
  as: "investigation"
});

Investigation.hasMany(ProfileInv, {
  foreignKey: "investigationids",
  as: "profileInvs"
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
  Nodal,
  ProfileInv,
  ProfileMaster,
};
