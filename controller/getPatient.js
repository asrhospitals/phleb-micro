const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
  Department,
} = require("../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Patient Data with Test + Bill + Abha + PPData + Trf

const getPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user;
    if (
      role?.toLowerCase() !== "phlebotomist" &&
      role?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    // Filter Details By hospital Id
    const { id } = req.params;

    // Get current date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // Check Hospital Details by Hospital ID
    // Validate the Hospital Is available or not
    const hospital = await Hospital.findOne({
      where: { id: id || req.user.hospital_id },
    });

    // Check Hospital Validity
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Get Hospital ID
    const hospital_id = hospital.id;

    // Get all Patient Data with Tests + Bills + Abha + PP Data by Hospital ID and Current Date
    const patientTests = await PatientTest.findAll({
      where: { hospital_id },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: [
            "id",
            "p_name",
            "p_age",
            "p_gender",
            "p_regdate",
            "p_mobile",
            "registration_status",
          ],
          where: { p_regdate: currentDate },

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
              ],
            },
          ],
        },
        {
          model: Investigation,
          as: "investigation",
          attributes: ["testname"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["dptname"],
            },
          ],
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
          p_name: plainTest.patient.p_name,
          p_age: plainTest.patient.p_age,
          p_regdate: plainTest.patient.p_regdate,
          p_mobile: plainTest.patient.p_mobile,
          registration_status: plainTest.patient.registration_status,
          p_gender: plainTest.patient.p_gender,
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
    const { role } = req.user;
    if (
      role?.toLowerCase() !== "phlebotomist" &&
      role?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    // Check User Id or Hospital Id
    const { hospital_id } = req.user;

    // Filter By hospital Name
    const { hospitalname } = req.params;

    // Find Hospital Information
    const hospital = await Hospital.findOne({
      where: { id: hospital_id, hospitalname: hospitalname },
    });

    // Check Hospital Validity
    if (
      !hospital ||
      hospital.hospitalname !== hospitalname ||
      hospital_id !== hospital.id
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
      where: { p_regdate: currentDate },
      attributes: [
        "id",
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_mobile",
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
    const { role } = req.user;
    if (role?.toLowerCase() !== "phlebotomist") {
      return res.status(403).json({
        message: "Access denied. Only phlebotomists can access this resource.",
      });
    }

    /* 2. Query Parameters */
    const { department, refdoc, pbarcode, billstatus, startDate, endDate } =
      req.query;
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
    if (startDate && endDate) {
      filters["$patient.p_regdate$"] = {
        [Op.between]: [startDate, endDate],
      };
    }

    /* Find Patients Matching the Query */
    const patients = await Patient.findAll({
      where: filters,
      order: [["id", "ASC"]],
      attributes: [
        "id",
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_mobile",
        "registration_status",
      ],
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
        {
          model: PatientTest,
          as: "patientTests",
          required: false, // ← allows patients without tests
          include: [
            {
              model: Investigation,
              as: "investigation",
              attributes: ["id", "testname", "department"],
            },
            { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
          ],
        },
      ],
    });

    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching patients ${error}`,
    });
  }
};

// 4. Get Patient By Mobile Number
const getPatientByMobile = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user;
    if (
      role?.toLowerCase() !== "phlebotomist" &&
      role?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Query Parameters */
    const { phone } = req.query;
    const filters = {};

    if (phone) {
      filters["p_mobile"] = {
        [Op.iLike]: `%${phone}%`,
      };
    }

    /* Find Patients Matching the Query */
    const patients = await Patient.findAll({
      where: filters,
      order: [["id", "ASC"]],
      attributes: [
        "id",
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_lname",
        "p_blood",
        "p_whtsap",
        "p_guardian",
        "city",
        "state",
      ],
      // include: [
      //   {
      //     model: ABHA,
      //     as: "patientAbhas",
      //     attributes: [
      //       "id",
      //       "isaadhar",
      //       "ismobile",
      //       "aadhar",
      //       "mobile",
      //       "abha",
      //     ],
      //   },
      //   {
      //     model: OPBill,
      //     as: "patientBills",
      //     attributes: [
      //       "id",
      //       "ptotal",
      //       "pdisc",
      //       "pamt",
      //       "pamtrcv",
      //       "pamtdue",
      //       "pamtmode",
      //       "pamtmthd",
      //       "billstatus",
      //       "pnote",
      //     ],
      //   },
      //   {
      //     model: PPPMode,
      //     as: "patientPPModes",
      //     attributes: [
      //       "id",
      //       "pscheme",
      //       "refdoc",
      //       "remark",
      //       "attatchfile",
      //       "pbarcode",
      //       "trfno",
      //       "pop",
      //       "popno",
      //       "pipno",
      //     ],
      //   },
      //   {
      //     model: PatientTest,
      //     as: "patientTests",
      //     required: false,
      //     include: [
      //       {
      //         model: Investigation,
      //         as: "investigation",
      //         attributes: ["id", "testname", "department"],
      //       },
      //       { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
      //     ],
      //   },
      // ],
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
  getPatientByMobile,
};
