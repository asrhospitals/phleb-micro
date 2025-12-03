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
const OPPaymentDetail=require("../relationalModels/opPaymentDetails");

// Associations

// Patient ↔ PatientTest
Patient.hasMany(PatientTest, { foreignKey: "pid", as: "patientTests" });
PatientTest.belongsTo(Patient, { foreignKey: "pid", as: "patient", targetKey: "id" });

// Patient ↔ OPBill
Patient.hasMany(OPBill, { foreignKey: "pid", as: "patientBills" });
OPBill.belongsTo(Patient, { foreignKey: "pid", as: "patient" });

// Patient ↔ PPPMode
Patient.hasMany(PPPMode, { foreignKey: "pid", as: "patientPPModes" });
PPPMode.belongsTo(Patient, { foreignKey: "pid", as: "patient" });

// Patient ↔ ABHA
Patient.hasMany(ABHA, { foreignKey: "pid", as: "patientAbhas" });
ABHA.belongsTo(Patient, { foreignKey: "pid", as: "patient" });


// Investigation ↔ PatientTest
Investigation.hasMany(PatientTest, { foreignKey: "investigation_id", as: "investigationTests" });
PatientTest.belongsTo(Investigation, { foreignKey: "investigation_id", as: "investigation" });


// Patient ↔ Hospital
Patient.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });
Hospital.hasMany(Patient, { foreignKey: "hospitalid", as: "patients" });

// Patient ↔ Nodal
Patient.belongsTo(Nodal, { foreignKey: "nodalid", as: "nodal" });
Nodal.hasMany(Patient, { foreignKey: "nodalid", as: "patients" });


// A single bill (OPBill) can have multiple payment details (OPPaymentDetail)
OPBill.hasMany(OPPaymentDetail, { foreignKey: 'op_bill_id', as: 'Payments' });
// A payment detail (OPPaymentDetail) belongs to one bill (OPBill)
OPPaymentDetail.belongsTo(OPBill, { foreignKey: 'op_bill_id', as: 'Bill' });



// Patient ↔ Investigation (many-to-many via PatientTest)
Patient.belongsToMany(Investigation, {
  through: PatientTest,
  foreignKey: "pid",
  otherKey: "investigation_id",   // ✅ corrected
});
Investigation.belongsToMany(Patient, {
  through: PatientTest,
  foreignKey: "investigation_id", // ✅ corrected
  otherKey: "pid",
});

// Profile associations
ProfileInv.belongsTo(ProfileMaster, {
  foreignKey: "profileid",
  as: "profile",
});
ProfileMaster.hasMany(ProfileInv, {
  foreignKey: "profileid",
  as: "profileInvs",
});

// ProfileInv ↔ Investigation
ProfileInv.belongsTo(Investigation, {
  foreignKey: "investigationids",
  as: "investigation",
});
Investigation.hasMany(ProfileInv, {
  foreignKey: "investigationids",
  as: "profileInvs",
});

// Investigation ↔ Department
Investigation.belongsTo(Department, { foreignKey: "departmentId", as: "department" }); // ✅ added alias
Department.hasMany(Investigation, { foreignKey: "departmentId", as: "investigations" });

// Investigation ↔ Result
Investigation.hasMany(Result, { foreignKey: "investigationId", as: "results" });
Result.belongsTo(Investigation, { foreignKey: "investigationId", as: "investigation" });

// Result ↔ NormalValue
Result.hasMany(NormalValue, { foreignKey: "resultId", as: "normalValues" });
NormalValue.belongsTo(Result, { foreignKey: "resultId", as: "result" });

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
  OPPaymentDetail
};




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
