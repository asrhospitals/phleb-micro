const Patient = require("../relationalModels/patient");
const Investigation = require("../relationalModels/investigation");
const PatientTest = require("../relationalModels/patientTests");
const Hospital = require("../relationalModels/hospital");
const OPBill = require("../relationalModels/opBill");
const PPPMode = require("../relationalModels/ppTest");
const ABHA = require("../relationalModels/abha");

// Associations

// ✅ Patient ↔ PatientTest
Patient.hasMany(PatientTest, { foreignKey: "patient_id", as: "patientTests" });
PatientTest.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

// ✅ Investigation ↔ PatientTest
Investigation.hasMany(PatientTest, {foreignKey: "investigation_id",as: "investigationTests",});
PatientTest.belongsTo(Investigation, {foreignKey: "investigation_id",as: "investigation",});

// ✅ Hospital ↔ PatientTest
Hospital.hasMany(PatientTest, {foreignKey: "hospitalid", as: "hospitalTests"});
PatientTest.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });

// ✅ Patient ↔ Bill
Patient.hasMany(OPBill, { foreignKey: "patient_id", as: "patientBills" });
OPBill.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

// ✅ Hospital ↔ Bill
Hospital.hasMany(OPBill, { foreignKey: "hospitalid", as: "hospitalBills" });
OPBill.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });

// ✅ Patient ↔ PPMode
Patient.hasMany(PPPMode, { foreignKey: "patient_id", as: "patientPPModes" });
PPPMode.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

// ✅ Hospital ↔ PPMode
Hospital.hasMany(PPPMode, { foreignKey: "hospitalid", as: "hospitalPPModes" });
PPPMode.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });

// ✅ Patient - Investigation many-to-many via PatientTest
Patient.belongsToMany(Investigation, {through: PatientTest,foreignKey: "patient_id",otherKey: "id",});
Investigation.belongsToMany(Patient, {through: PatientTest,foreignKey: "id",otherKey: "patient_id",});

// ✅ Patient ↔ ABHA
Patient.hasMany(ABHA, { foreignKey: "patient_id", as: "patientAbhas" });
ABHA.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

// Patient ↔ Hospital
Patient.belongsTo(Hospital, { foreignKey: "hospitalid", as: "hospital" });
Hospital.hasMany(Patient, { foreignKey: "hospitalid", as: "patients" });

module.exports = {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
};
