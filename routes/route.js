const Router = require("express");
const { updateTestStatus } = require("../controller/updateTestStatus");
const { addPatient } = require("../controller/addPatient");
const { getPatient } = require("../controller/getPatient");
const { updatePatientInfo } = require("../controller/updatePatient");
const { getShortCodes } = require("../controller/getTestCode");

const router = Router();

// 1. Add Patient With Tests
router.route("/add-patient-test").post(addPatient);

// 2. Get Patient Test Data
router.route("/get-patient-test/:hospitalname").get(getPatient);

// 3. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatientInfo);

// 4. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

// 5. Get Short Code
router.route("/get-shortcodes").get(getShortCodes);

// 6. Search Api

module.exports = router;
