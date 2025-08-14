const Router = require("express");
const {
  addPatientTest,
  getPatientTest,
  updateTestStatus,
  updatePatient,
} = require("../controller/patientController");
const {
  createPatient,
  getPatinet,
} = require("../controller/patientRegistration");
const router = Router();

// 1. Create Patient General Information
router.route("/add-patient").post(createPatient);

// 2. Get Patient General Information
router.route("/get-patient").get(getPatinet);

// 3. Add Patient With Tests
router.route("/add-patient-test").post(addPatientTest);

// 4. Get Patient Test Data
router.route("/get-patient-test/:hospitalname").get(getPatientTest);

// 5. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatient);

// 6. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

module.exports = router;
