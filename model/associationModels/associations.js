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
const InvDetail = require("../relationalModels/invDisc");

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

InvDetail.belongsTo(OPBill, {
    foreignKey: 'op_bill_id', // Links to the 'id' in the patient_op_bills table
    as: 'opBillHeader'        // Alias for easy retrieval
});

// We must also define the reverse association in the OPBill model:
OPBill.hasMany(InvDetail, {
    foreignKey: 'op_bill_id',
    as: 'investigationDetails' // Used to fetch all items for a bill
});


// 2. Association with the Investigation Master Data (investigations)

// InvDetail BELONGS TO Investigation (Many-to-One)
// Each line item references one specific master test/service.
InvDetail.belongsTo(Investigation, {
    foreignKey: 'inv_id', // Links to the 'id' in the investigations table
    as: 'investigation'   // Alias for easy retrieval of the test name, etc.
});

// We must also define the reverse association in the Investigation model:
Investigation.hasMany(InvDetail, {
    foreignKey: 'inv_id',
    as: 'billLineItems' // Used to see where this master test was billed
});



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
  OPPaymentDetail,
  InvDetail
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
