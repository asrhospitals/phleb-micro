const Router = require("express");
const { updateTestStatus } = require("../controller/patientControllers/updateTestStatus");
const { addPatient, createPatient } = require("../controller/patientControllers/addPatient");
const {getPatient,searchPatient,getPatientByMobile,getPatientById, getTestData, searchPatientBy} = require("../controller/patientControllers/getPatient");
const { updatePatientInfo } = require("../controller/patientControllers/updatePatient");
const { searchTest } = require("../controller/patientControllers/getTestCode");

const router = Router();

// 1. Add Patient With Tests for Phlebotomist/Hospital/Center
router.route("/add-patient-test").post(addPatient);

// 2.  Add Patient With Tests for Admin
router.route("/create-patient").post(createPatient);

// 3. Get Patient Data of a Hospital/Center
router.route("/get-patient-data/:hospitalid").get(getPatient);

// 4. Get Patient By Id
router.route("/get-patient/:patientid").get(getPatientById);

// 5. Search Patient Data
router.route("/search-patient").get(searchPatient);

// 6. Get Patient By Mobile Number
router.route("/get-data-mobile").get(getPatientByMobile);

// 7. Get Test Data
router.route("/get-patient-test/:hospitalid").get(getTestData);

// 8. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatientInfo);

// 9. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

// 10. Search Test by Test name or Shortcode
router.route("/search-test").get(searchTest);

// 11. Search Patient For Admin By Hospital id and Date Filter
router.route("/get-data/:hospitalid").get(searchPatientBy);



module.exports = router;
