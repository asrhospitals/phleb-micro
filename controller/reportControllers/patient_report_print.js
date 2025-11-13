const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  PPPMode,
} = require("../../model/associationModels/associations");

const getReport = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (roleType?.toLowerCase() !== "phlebotomist" && roleType?.toLowerCase() !== "reception" ) {
      return res.status(403).json({
        message: "Access denied. Only phlebotomists and receptionist can access this resource.",
      });
    }

    /* 2. Check if Hospital ID is valid */
    const { hospitalid } = req.params;

    const hospital = await Hospital.findOne({
      where: { id: hospitalid },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    /* 3. Pagination Details */
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 4. Get current date in 'YYYY-MM-DD' format */
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    /* 5. Query patients with investigations where test_collection is "Yes" */
    const { count, rows } = await Patient.findAndCountAll({
      where: {
        // p_regdate: currentDate,
        hospitalid: targetHospitalId,
      },
      attributes: ["id", "p_name", "p_regdate"],
      include: [
        {
          model: PPPMode,
          as: "patientPPModes",
          required: false,
          attributes: ["attatchfile", "pbarcode"],
        },
        {
          model: PatientTest,
          as: "patientTests",
          attributes: ["id", "status", "h_l_flag", "test_result"],
          include: [
            {
              model: Investigation,
              as: "investigation",
              attributes: ["testname"],
            },
          ],
        },
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"],
        },
      ],
      limit: limit,
      offset: offset,
      order: [["id", "ASC"]],
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    // Improved response check
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        data: [],
        meta: {
          totalItems: 0,
          itemsPerPage: limit,
          currentPage: page,
          totalPages: 0,
        },
        message: "No reports found for today.",
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
    console.error("Error in getCenterTestData:", error);
    return res.status(500).json({
      message: `Something went wrong while fetching center test data: ${error.message}`,
    });
  }
};

module.exports = { getReport };
