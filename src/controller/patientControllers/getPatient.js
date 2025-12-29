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
  InvDetail,
  DerivedTestComponent,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

const patientService = require("./patientService/patient.service");

// 1. Get Patient Data with Test + Bill + Abha + PPData + Trf
/**
 * @description Handles the GET request to retrieve a paginated list of patients
 * for a specific hospital, registered on the current date.
 * @param {object} req - Express request object (contains user context, hospitalid param, and query data)
 * @param {object} res - Express response object
 */
const getPatientByFlagFilters = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (roleType?.toLowerCase() !== "reception") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    /* 2. Pass Hospital Id */

    const { hospitalid } = req.params;

    const hospital = await Hospital.findByPk(hospitalid);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital Not Found" });
    }

    /* 3. Query Parameters */
    const { q, startDate, endDate } = req.query;

    /* 4. Pagination Details */
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 5. Find Patients Matching the Query and the Hospital */
    const whereClause = {
      hospitalid: hospital.id,
      p_regdate: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Only add p_flag filter if 'q' is provided
    if (q) {
      whereClause.p_flag = q;
    }

    /* 5. Find Patients Matching the Query and the Hospital */
    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,

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
            "id",
            "ptotal",
            "pdisc_percentage",
            "pdisc_amount",
            "pamt_receivable",
            "pamt_received_total",
            "pamt_due",
            "pamt_mode",
            "pnote",
            "billstatus",
            "paymentDetails",
            "invDetails",
            "review_status",
            "review_days",
            "bill_date",
          ],
          order: [["id", "DESC"]],
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
          where: { status: "center" }, // Filter by status
          required: false, // Patients can exist without a current 'center' test
          attributes: [
            "id",
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
              // where: { test_collection: "No" }, // Filter investigations
              attributes: [
                "testname",
                "testmethod",
                "sampletype",
                "test_collection",
                "shortname",
              ],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["dptname"],
                },
                { model: Result, as: "results", attributes: ["unit"] },
                {
                  model: DerivedTestComponent,
                  as: "components",
                  attributes: ["formula"],
                  include: [
                    {
                      model: Investigation,
                      as: "childTest",
                      attributes: ["testname"],
                      include: [
                        {
                          model: Result,
                          as: "results",
                          attributes: ["unit"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
      ],
      limit: limit,
      offset: offset,
      order: [["id", "DESC"]],
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

/**
 * @description Handles the GET request to retrieve a paginated list of patient tests
 * for a specific hospital, registered today and associated with PPP mode. (Refactored)
 * @param {object} req - Express request object (contains user context, hospitalid param, and query data)
 * @param {object} res - Express response object
 */
const getTestData = async (req, res) => {
  try {
    /* 1. Authorization & Hospital ID Validation */
    const { roleType, hospitalid: userHospitalId } = req.user;
    const paramHospitalId = parseInt(req.params.hospitalid);

    if (
      roleType?.toLowerCase() !== "reception" &&
      roleType?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only receptions and admins can access this resource.",
      });
    }

    let targetHospitalId;

    if (roleType?.toLowerCase() === "admin") {
      if (!paramHospitalId) {
        return res
          .status(400)
          .json({ message: "Hospital ID is required for admin" });
      }
      targetHospitalId = paramHospitalId;
    } else {
      if (paramHospitalId !== userHospitalId) {
        return res.status(403).json({
          message: "Access denied. Hospital ID mismatch.",
        });
      }
      targetHospitalId = userHospitalId;
    }

    /* 2. Execute Business Logic via Service Layer */
    const result = await patientService.getPatientTestData(
      targetHospitalId,
      req.query
    );

    /* 3. Respond to Client - Success */
    return res.status(200).json({
      data: result.data,
      meta: {
        totalItems: result.totalItems,
        itemsPerPage: result.limit,
        currentPage: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while fetching patient ${error}`,
    });
  }
};

/**
 * @description Handles the GET request to search for patients based on complex filters. (Refactored)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const searchPatient = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    // Fixed: Changed && to || (OR logic)
    if (
      roleType !== "reception" &&
      roleType !== "admin" &&
      roleType !== "reception"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only receptions, admins, and reception can access this resource.",
      });
    }

    /* 2. Hospital filters */
    const { hospitalid } = req.params;

    const hospital = await Hospital.findByPk(hospitalid);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    /* 4. Paginate Results */
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    /* 3. Query Parameters */
    const { q, startDate, endDate } = req.query;

    // Fixed: Use OR conditions for search query
    const filters = {};
    const orConditions = [];

    // Search across multiple fields with OR logic
    if (q) {
      orConditions.push(
        { "$patient.p_mobile$": { [Op.like]: `%${q}%` } },
        { "$patient.p_name$": { [Op.iLike]: `%${q}%` } },
        { "$patient.uhid$": { [Op.iLike]: `%${q}%` } }
      );
    }

    // Date range filter (separate from search)
    if (startDate && endDate) {
      filters["$patient.p_regdate$"] = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Combine filters
    const whereClause = {
      hospitalid: hospital.id, // Added back hospital filter
      ...filters,
    };

    if (orConditions.length > 0) {
      whereClause[Op.or] = orConditions;
    }

    /* 5. Find Patients Matching the Query */
    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,
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
            "pdisc_percentage",
            "pdisc_amount",
            "pamt_receivable",
            "pamt_received_total",
            "pamt_due",
            "pamt_mode",
            "pnote",
            "billstatus",
            "paymentDetails",
            "invDetails",
            "review_status",
            "review_days",
            "bill_date",
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
      subQuery: false,
    });

    // 6. Handle No Results Found
    if (!rows) {
      return res.status(404).json({
        message: "No data available",
      });
    }

    const totalPages = Math.ceil(count / limit);

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
    console.error("Error searching patients:", error); // Added logging
    return res.status(500).json({
      message: `Something went wrong while searching patients: ${error.message}`,
    });
  }
};

// 5. Get Patient By Id
const getPatientById = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "reception" &&
      roleType?.toLowerCase() !== "admin" &&
      roleType?.toLowerCase() !== "reception"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only receptions and admins can access this resource.",
      });
    }

    /* 2. Path Parameters */
    const { patientid } = req.params;

    /* Find Patient By Id */
    const patient = await Patient.findOne({
      where: { id: patientid },
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
            "id",
            "ptotal",
            "pdisc_percentage",
            "pdisc_amount",
            "pamt_receivable",
            "pamt_received_total",
            "pamt_due",
            "pamt_mode",
            "pnote",
            "billstatus",
            "paymentDetails",
            "invDetails",
            "review_status",
            "review_days",
            "bill_date",
          ],
          order: [["id", "DESC"]],
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
          where: { status: "center" }, // Filter by status
          required: false, // Patients can exist without a current 'center' test
          attributes: [
            "id",
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
              // where: { test_collection: "No" }, // Filter investigations
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
                {
                  model: DerivedTestComponent,
                  as: "components",
                  attributes: ["formula"],
                  include: [
                    {
                      model: Investigation,
                      as: "childTest",
                      attributes: ["testname"],
                      include: [
                        {
                          model: Result,
                          as: "results",
                          attributes: ["unit"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
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

// 6. Search Barcode
const searchBarcode = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "reception" &&
      roleType?.toLowerCase() !== "reception"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only receptions, admins, and receptionists can access this resource.",
      });
    }

    /* 3. Query Parameters */
    const { pbarcode } = req.query;
    const filters = {};

    if (pbarcode) {
      filters["$patientPPModes.pbarcode$"] = pbarcode;
    }

    /* Find Barcode Matching the Query */
    const result = await Patient.findAndCountAll({
      where: filters,
      include: [
        {
          model: PPPMode,
          as: "patientPPModes",
          attributes: ["pbarcode"],
        },
      ],
      order: [["id", "ASC"]],

      distinct: true,
      col: "id",
      subQuery: false,
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "No matching barcode found." });
    }

    return res.status(200).json({ message: "Barcode found" });
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching patients ${error}`,
    });
  }
};

module.exports = {
  searchPatient,
  getPatientById,
  getTestData,
  searchBarcode,
  getPatientByFlagFilters,
};
