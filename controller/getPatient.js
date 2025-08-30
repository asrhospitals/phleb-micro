const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
} = require("../model/associationModels/associations");
const { Op } = require("sequelize");


// 1. Get Patient Data with Test + Bill + Abha + PPData + Trf

const getPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user || {};
    if (role?.toLowerCase() !== "phlebotomist") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. Only phlebotomists can access this resource.",
        });
    }

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
              attributes: [
                "id",
                "ptotal",
                "pdisc",
                "pamt",
                "pamtrcv",
                "pamtdue",
                "pamtmode",
                "pamtmthd",
                "billstatus",
                "pnote",
              ],
            },
            {
              model: PPPMode,
              as: "patientPPModes",
              attributes: [
                "id",
                "pscheme",
                "refdoc",
                "remark",
                "attatchfile",
                "pbarcode",
                "trfno",
                "pop",
                "popno",
                "pipno",
              ],
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
    return res.status(500).json({
      message: `Something went wrong while fetching patients ${err}`,
    });
  }
};

// 2. Get General Patient Data arrange by current date

const fetchPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user || {};
    if (role?.toLowerCase() !== "phlebotomist") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. Only phlebotomists can access this resource.",
        });
    }

    // Check User Id or Hospital Id
    const { hospitalid } = req.user;

    // Filter By hospital Name
    const { hospitalname } = req.params;

    // Find Hospital Information
    const hospital = await Hospital.findOne({
      where: { id: hospitalid, hospitalname: hospitalname },
    });

    // Check Hospital Validity
    if (
      !hospital ||
      hospital.hospitalname !== hospitalname ||
      hospitalid !== hospital.id
    ) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }

    // Get current date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // Get Patient Data by Hospital ID
    // Simply Return the Patient Information
    const patients = await Patient.findAll({
      where: { pregdate: currentDate },
      attributes: [
        "id",
        "pname",
        "page",
        "pgender",
        "pregdate",
        "pmobile",
        "registration_status",
      ],
      include: [
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"],
          where: { hospitalname: hospital.hospitalname },
        },
      ],
    });

    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while fetching patients ${error}`,
    });
  }
};

// 3. Search Patient Details
const searchPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user || {};
    if (role?.toLowerCase() !== "phlebotomist") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. Only phlebotomists can access this resource.",
        });
    }

    /* 2. Query Parameters */
    const { department, refdoc, pbarcode, billstatus } = req.query;
    const filters = {};
    if (department) {
      filters["$investigation.department$"] = department;
    }
    if (refdoc) {
      filters["$patient.patientPPModes.refdoc$"] = {
        [Op.iLike]: `%${refdoc}%`,
      };
    }
    if (pbarcode) {
      filters["$patient.patientPPModes.pbarcode$"] = pbarcode;
    }
    if (billstatus) {
      filters["$patient.patientBills.billstatus$"] = billstatus;
    }

    /* Find Patients Matching the Query */
  const patients = await PatientTest.findAll({
      where: filters,
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: [
            "id", "pname", "page", "pgender", "pregdate", "pmobile", "registration_status"
          ],
          include: [
            {
              model: ABHA,
              as: "patientAbhas",
              attributes: ["id", "isaadhar", "ismobile", "aadhar", "mobile", "abha"]
            },
            {
              model: OPBill,
              as: "patientBills",
              attributes: ["id", "ptotal", "pdisc", "pamt", "pamtrcv", "pamtdue", "pamtmode", "pamtmthd", "billstatus", "pnote"]
            },
            {
              model: PPPMode,
              as: "patientPPModes",
              attributes: ["id", "pscheme", "refdoc", "remark", "attatchfile", "pbarcode", "trfno", "pop", "popno", "pipno"]
            }
          ]
        },
        {
          model: Investigation,
          as: "investigation",
          attributes: ["id", "testname", "department"]
        },
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"]
        }
      ]
    });



    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching patients ${error}`,
    });
  }
};

module.exports = {
  getPatient,
  fetchPatient,
  searchPatient,
};
