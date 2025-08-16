const Router = require("express");
const {
  addPatientTest,
  getPatientTest,
  updateTestStatus,
  updatePatient,
  getShortCode,
} = require("../controller/patientController");

const router = Router();



// 1. Add Patient With Tests
router.route("/add-patient-test").post(addPatientTest);

// 2. Get Patient Test Data
router.route("/get-patient-test/:hospitalname").get(getPatientTest);

// 3. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatient);

// 4. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

// 5. Get Short Code
router.route("/get-shortcodes").get(getShortCode);

// 6. Search Api

module.exports = router;
