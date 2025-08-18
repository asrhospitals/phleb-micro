const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
} = require("../model/associationModels/associations");


// 1. Get Patient Data

const getPatient = async (req, res) => {
  try {

    // Check if the user is authenticated and has a hospitalid
    const { hospitalid } = req.user;

    // Filter Details By hospital Name
    const { hospitalname } = req.params;

    // Get current date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // Check Hospital Details by Name
    const hospital = await Hospital.findOne({
      where: { id: hospitalid, hospitalname: hospitalname },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Get all Patient Data with Tests + Bills + Abha + PP Data by Hospital ID and Current Date
    const patientTests = await PatientTest.findAll({
      where: { hospitalid: hospital.id },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: [
            "id",
            "pname",
            "page",
            "pgender",
            "pregdate",
            "pmobile",
            "registration_status",
          ],
          where: { pregdate: currentDate },

          include: [
            {
              model: ABHA,
              as: "patientAbhas",
              attributes: [
                "id",
                "isaadhar",
                "ismobile",
                "aadhar",
                "mobile",
                "abha",
              ],
            },
            {
              model: OPBill,
              as: "patientBills",
              attributes: ["id", "ptotal", "pamt", "pamtmode", "pamtmthd"],
            },
            {
              model: PPPMode,
              as: "patientPPModes",
              attributes: ["id", "pscheme", "refdoc", "remark", "attatchfile"],
            },
          ],
        },
        {
          model: Investigation,
          as: "investigation",
          attributes: ["id", "testname", "department"],
        },
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"],
        },
      ],
    });

    // Check if there is no Test + ABHA + OpBill + PP Data Not added to a Patient
    if (
      !patientTests ||
      patientTests.length === 0 ||
      patientTests[0].patient.patientPPModes.length === 0 ||
      patientTests[0].patient.patientAbhas.length === 0
    ) {

      // Simply Return the Patient Information
      const patients = await Patient.findAll({
        where: {
          hospitalid: hospital.id,
          pregdate: currentDate,
        },
        attributes: [
          "id",
          "pname",
          "page",
          "pgender",
          "pregdate",
          "pmobile",
          "registration_status",
        ],
      });

      return res.status(200).json(patients);
    }

    // Else Group All Patient Informaion with Test + Bills + Abha + PP Data
    const groupedByPatient = {};

    patientTests.forEach((test) => {
      const patientId = test.patient_id;
      const plainTest = test.get({ plain: true });

      if (!groupedByPatient[patientId]) {
        groupedByPatient[patientId] = {
          patient_id: patientId,
          pname: plainTest.patient.pname,
          page: plainTest.patient.page,
          pregdate: plainTest.patient.pregdate,
          mobile: plainTest.patient.pmobile,
          registration_status: plainTest.patient.registration_status,
          pgender: plainTest.patient.pgender,
          hospital_name: plainTest.hospital.hospitalname,
          tests: [],
          bills: plainTest.patient.patientBills || [],
          ppdata: plainTest.patient.patientPPModes || [],
          abha_data: plainTest.patient.patientAbhas || [],
        };
      }

      groupedByPatient[patientId].tests.push({
        patient_test_id: plainTest.patient_test_id,
        investigation_id: plainTest.investigation_id,
        testname: plainTest.investigation.testname,
        department: plainTest.investigation.department,
        status: plainTest.status,
        rejection_reason: plainTest.rejection_reason,
        createdAt: plainTest.createdAt,
        updatedAt: plainTest.updatedAt,
      });
    });

    // Convert to array
    const groupedResults = Object.values(groupedByPatient);

    res.status(200).json(groupedResults);
  } catch (err) {
    res.status(500).json({
      message:
        err.message || "Something went wrong while fetching patient tests.",
    });
  }
};

module.exports = {
  getPatient,
};
