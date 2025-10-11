const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
  Department,
  Result,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Patient Data with Test + Bill + Abha + PPData + Trf
const getPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Check if Hospital ID is valid */
    const { hospitalid } = req.params;

    let targetHospitalId;

    if (req.user.roleType?.toLowerCase() === "admin") {
      // Admins can only pass hospital id in the request
      if (!hospitalid) {
        return res
          .status(400)
          .json({ message: "Hospital ID is required for admin" });
      }
      targetHospitalId = parseInt(hospitalid);
    } else {
      // Non-admin users must only use their own hospital id
      if (parseInt(hospitalid) !== req.user.hospital_id) {
        return res.status(403).json({
          message: "Access denied. Hospital ID mismatch.",
        });
      }
      targetHospitalId = req.user.hospital_id;
    }

    const hospital = await Hospital.findOne({
      where: { id: targetHospitalId },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    /* 2. Pagination Details*/
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 3. Get current date in 'YYYY-MM-DD' format */
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    /* 5. Find Patient  */
    const { count, rows } = await Patient.findAndCountAll({
      where: {
        p_regdate: currentDate,
        hospital_id: targetHospitalId,
        reg_by: "Center",
      },
      attributes: [
        "id",
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_lname",
        "p_mobile",
        "reg_by",
      ],

      include: [
        {
          model: ABHA,
          as: "patientAbhas",
          attributes: ["isaadhar", "ismobile", "aadhar", "mobile", "abha"],
        },
        {
          model: OPBill,
          as: "patientBills",
          attributes: [
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
        { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
      ],
      limit: limit,
      offset: offset,
      order: [["id", "ASC"]],
      distinct: true,
      col: "id",
    });

    const totalPages = Math.ceil(count / limit);

    if (!rows) {
      return res.status(404).json({
        message: "No data available for the given hospital and date.",
      });
    }

    return res.status(200).json({
      data: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while fetching patient ${error}`,
    });
  }
};

// 2. Get Test Data
const getTestData = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Check if Hospital ID is valid */
    const { hospitalid } = req.params;

    let targetHospitalId;

    if (req.user.roleType?.toLowerCase() === "admin") {
      // Admins can only pass hospital id in the request
      if (!hospitalid) {
        return res
          .status(400)
          .json({ message: "Hospital ID is required for admin" });
      }
      targetHospitalId = parseInt(hospitalid);
    } else {
      // Non-admin users must only use their own hospital id
      if (parseInt(hospitalid) !== req.user.hospital_id) {
        return res.status(403).json({
          message: "Access denied. Hospital ID mismatch.",
        });
      }
      targetHospitalId = req.user.hospital_id;
    }

    const hospital = await Hospital.findOne({
      where: { id: targetHospitalId },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    /* 2. Pagination Details*/
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 3. Get current date in 'YYYY-MM-DD' format */
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    /* 5. Find Patient  */
    const { count, rows } = await Patient.findAndCountAll({
      where: {
        p_regdate: currentDate,
        hospital_id: targetHospitalId,
      },
      attributes: [
        "id",
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_lname",
        "p_mobile",
        "reg_by",
      ],
      include: [
        {
          model: PPPMode,
          as: "patientPPModes",
          required: false,
          attributes: [
            "remark",
            "attatchfile",
            "pbarcode",
            "trfno",
            "pop",
            "popno",
          ],
        },
        {
          model: PatientTest,
          as: "patientTests",
          where: { status: "center" },
          attributes: [
            "test_id",
            "status",
            "rejection_reason",
            "test_created_date",
            "test_updated_date",
            "test_result",
            "test_image",
          ],
          include: [
            {
              model: Investigation,
              as: "investigation",
              where: { test_collection: "No" },
              attributes: [
                "testname",
                "testmethod",
                "sampletype",
                "test_collection",
              ],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["dptname"],
                },
                { model: Result, as: "results", attributes: ["unit"] },
              ],
            },
          ],
        },
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"],
        },
      ],
      limit,
      offset,
      order: [["id", "ASC"]],
      subQuery: false,
    });

    const totalPages = Math.ceil(count / limit);

    if (!rows) {
      return res.status(404).json({
        message: "No data available for the given hospital and date.",
      });
    }

    return res.status(200).json({
      data: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while fetching patient ${error}`,
    });
  }
};

// 3. Search Patient Details
const searchPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Query Parameters */
    const { department, refdoc, pbarcode, billstatus, startDate, endDate } =
      req.query;
    const filters = {};
    if (department) {
      filters["$patientTests.investigation.department.dptname$"] = department;
    }
    if (refdoc) {
      filters["$patientPPModes.refdoc$"] = {
        [Op.iLike]: `%${refdoc}%`,
      };
    }
    if (pbarcode) {
      filters["$patientPPModes.pbarcode$"] = pbarcode;
    }
    if (billstatus) {
      filters["$patientBills.billstatus$"] = billstatus;
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
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_lname",
        "p_mobile",
      ],
      include: [
        {
          model: ABHA,
          as: "patientAbhas",
          attributes: ["isaadhar", "ismobile", "aadhar", "mobile", "abha"],
        },
        {
          model: OPBill,
          as: "patientBills",
          attributes: [
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
        {
          model: PatientTest,
          as: "patientTests",
          attributes: [
            "status",
            "rejection_reason",
            "test_created_date",
            "test_updated_date",
            "test_result",
            "test_image",
          ],
          include: [
            {
              model: Investigation,
              as: "investigation",
              attributes: ["testname", "testmethod", "sampletype"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["dptname"],
                },
                { model: Result, as: "results", attributes: ["unit"] },
              ],
            },
          ],
        },
        { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
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
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin"
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
    });

    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching patients ${error}`,
    });
  }
};

// 5. Get Patient By Id
const getPatientById = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Path Parameters */
    const { patientid } = req.params;

    /* Find Patient By Id */
    const patient = await Patient.findOne({
      where: { id: patientid },
      attributes: [
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
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while fetching patient ${error}`,
    });
  }
};

// 6. Search By Date and Hospital Id
const searchPatientBy = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (roleType?.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admins can access this resource.",
      });
    }

    /* 2. Pass Hospital Id */

    const { hospitalid } = req.params;

    const hospital = await Hospital.findByPk(hospitalid);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital Not Found" });
    }

    /* 3. Query Parameters */
    const { startDate, endDate } = req.query;

    /* 4. Pagination Details */
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 5. Find Patients Matching the Query and the Hospital */
    const { count, rows } = await Patient.findAndCountAll({
      where: {
        hospital_id: hospital.id,
        p_regdate: {
          [Op.between]: [startDate, endDate],
        },
      },

      attributes: [
        "p_name",
        "p_age",
        "p_gender",
        "p_regdate",
        "p_lname",
        "p_mobile",
      ],
      include: [
        {
          model: ABHA,
          as: "patientAbhas",
          attributes: ["isaadhar", "ismobile", "aadhar", "mobile", "abha"],
        },
        {
          model: OPBill,
          as: "patientBills",
          attributes: [
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
        {
          model: PatientTest,
          as: "patientTests",
          attributes: [
            "status",
            "rejection_reason",
            "test_created_date",
            "test_updated_date",
            "test_result",
            "test_image",
          ],
          include: [
            {
              model: Investigation,
              as: "investigation",
              attributes: ["testname", "testmethod", "sampletype"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["dptname"],
                },
                { model: Result, as: "results", attributes: ["unit"] },
              ],
            },
          ],
        },
        { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
      ],
      limit: limit,
      offset: offset,
      order: [["id", "ASC"]],
      distinct: true,
      col: "id",
    });

    const totalPages = Math.ceil(count / limit);

    if (!rows) {
      return res.status(404).json({
        message: "No data available for the given hospital and date.",
      });
    }

    return res.status(200).json({
      data: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching patients ${error}`,
    });
  }
};

module.exports = {
  getPatient,
  searchPatient,
  getPatientByMobile,
  getPatientById,
  getTestData,
  searchPatientBy,
};
