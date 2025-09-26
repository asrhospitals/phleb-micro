const Route = require("express");
const { reportEntry, getCenterTestData, rejectTests, getRejectReport } = require("../controller/reportControllers/reportEntry");
const router = Route();


// 1. Get Test Data of A Center/Hospital
router.route("/get-center-test/:hospitalid").get(getCenterTestData);

// 2. Report Entry by Patient ID
router.route("/report-entry/:patientId").put(reportEntry);

// 3. Report entry Reject By Patient ID
router.route("/report-reject/:patientId").put(rejectTests);

// 4. Get Rejected reports
router.route("/get-reject-report/:hospitalid").get(getRejectReport)

module.exports = router;
