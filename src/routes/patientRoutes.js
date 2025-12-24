const Router = require("express");
const {
  updateTestStatus,
} = require("../controller/patientControllers/updateTestStatus");

const {
  getPatient,
  searchPatient,
  getPatientByMobile,
  getPatientById,
  getTestData,
  searchBarcode,
  searchPatientBy,
} = require("../controller/patientControllers/getPatient");
const {
  updatePatientInfo,
  updateBillData,
  updatePatientTestData,
} = require("../controller/patientControllers/updatePatient");
const { searchTest } = require("../controller/patientControllers/getTestCode");

const {
  addGeneralPatientRegistration,
  addPatientWithBillAndTest,
  addPPPPatientWithTest,
} = require("../controller/patientControllers/patientRegistration");
const { route } = require("../controller/patientControllers/trf");

const router = Router();

// 1. Add Patient With Tests for Phlebotomist/Hospital/Center
router
  .route("/general-patient-registration")
  .post(addGeneralPatientRegistration);

// 2. Add Patient with PPP Registartion
router.route("/ppp-patient-registration").post(addPPPPatientWithTest);

// 3. Add Patient With Bill and Test

router.route("/bill-patient-registartion").post(addPatientWithBillAndTest);

// 3. Get Patient Data of a Hospital/Center
router.route("/get-patient-data/:hospitalid").get(getPatient);

// 4. Get Patient By Id
router.route("/get-patient/:patientid").get(getPatientById);

// 5. Search Patient Data
router.route("/search-patient/:hospitalid").get(searchPatient);

// 6. Get Patient By Mobile Number
// router.route("/get-data-mobile").get(getPatientByMobile);

// 7. Get Test Data
router.route("/get-patient-test-data/:hospitalid").get(getTestData);

// 8. Update Patient Infographic Data
router.route("/update-patient-infographic/:patient_id").put(updatePatientInfo);

// 9. Send Test to Respective Node
router.route("/send-tests").put(updateTestStatus);

// 10. Search Test by Test name or Shortcode
router.route("/search-test").get(searchTest);

// 11. Search Patient For Admin By Hospital id and Date Filter
// router.route("/get-data/:hospitalid").get(searchPatientBy);

// 12. Search Barcode
router.route("/search-code").get(searchBarcode);

// 13. Update Bill Data
router.route("/update-patient-bill/:patientId/:billId").put(updateBillData);

// 14. Update Test
router.route("/update-patient-test/:id").put(updatePatientTestData);

module.exports = router;
