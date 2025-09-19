const Router = require("express");
const { updateTestStatus } = require("../controller/updateTestStatus");
const { addPatient, createPatient } = require("../controller/addPatient");
const {
  getPatient,
  fetchPatient,
  searchPatient,
  getPatientByMobile,
} = require("../controller/getPatient");
const { updatePatientInfo } = require("../controller/updatePatient");
const { searchTest } = require("../controller/getTestCode");

const router = Router();

// 1. Add Patient With Tests for Phlebotomist
router.route("/add-patient-test").post(addPatient);

// 2.  Add Patient Without Tests for Admin
router.route("/create-patient").post(createPatient);

// 3. Get Patient Test Data
router.route("/get-patient-test/:id").get(getPatient);

// 4. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatientInfo);

// 5. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

// 6. Get General Patient Info
router.route("/get-info/:id").get(fetchPatient);

// 7. Search Patient Data
router.route("/search-patient").get(searchPatient);

// 8. Get Patient By Mobile Number
router.route("/get-data-mobile").get(getPatientByMobile);

// 9. Search Test by Test name or Shortcode
router.route("/search-test").get(searchTest);

module.exports = router;
