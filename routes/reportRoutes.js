const Route = require("express");
const { reportEntry, getCenterTestData, rejectTests, getRejectReport } = require("../controller/reportControllers/reportEntry");
const { getReport } = require("../controller/reportControllers/patient_report_print");
const router = Route();


// 1. Get Test Data of A Center/Hospital
router.route("/get-center-test/:hospitalid").get(getCenterTestData);

// 2. Report Entry by Patient ID
router.route("/report-entry/:patientId").put(reportEntry);

// 3. Report entry Reject By Patient ID
router.route("/report-reject/:patientId").put(rejectTests);

// 4. Get Rejected reports
router.route("/get-reject-report/:hospitalid").get(getRejectReport);


// 5. Print Patient Report
router.route('/patient-report/:hospitalid').get(getReport);



module.exports = router;
