const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  PPPMode,
  Department,
  Result,
} = require("../../model/associationModels/associations");

// 1. Get report Entry Details of Center/Hospital
const getCenterTestData = async (req, res) => {
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
      if (!hospitalid) {
        return res
          .status(400)
          .json({ message: "Hospital ID is required for admin" });
      }
      targetHospitalId = parseInt(hospitalid);
    } else {
      if (parseInt(hospitalid) !== req.user.hospitalid) {
        return res.status(403).json({
          message: "Access denied. Hospital ID mismatch.",
        });
      }
      targetHospitalId = req.user.hospitalid;
    }

    const hospital = await Hospital.findOne({
      where: { id: targetHospitalId },
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
              where: { test_collection: "Yes" },
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
        message: "No patients found with center status tests for today.",
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

// 2. Report Entry Done at Center/Hospital
const reportEntry = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Handle multiple test results
    if (req.body.test_results && Array.isArray(req.body.test_results)) {
      const { test_results } = req.body;

      if (test_results.length === 0) {
        return res.status(400).json({ message: "No test results added" });
      }

      let updatedCount = 0;
      for (const item of test_results) {
        const {
          test_id,
          test_result,
          test_image,
          h_l_flag,
          units,
          reference_range,
          critical_range,
          method,
          sample_type,
        } = item;

        if (!test_id || !test_result) continue;

        const [rowsUpdated] = await PatientTest.update(
          {
            test_result,
            test_image,
            h_l_flag,
            units,
            reference_range,
            critical_range,
            method,
            sample_type,
            status: "docpending",
          },
          { where: { test_id, patient_id: patientId } }
        );

        if (rowsUpdated > 0) updatedCount++;
      }

      return res.status(200).json({
        message: `Successfully updated ${updatedCount} test result(s)`,
      });
    }

    // Handle single test result
    else {
      const {
        test_id,
        test_result,
        test_image,
        h_l_flag,
        units,
        reference_range,
        critical_range,
        method,
        sample_type,
      } = req.body;

      if (!test_id || !test_result) {
        return res.status(400).json({ message: "Invalid test data" });
      }

      const [rowsUpdated] = await PatientTest.update(
        {
          test_result,
          test_image,
          h_l_flag,
          units,
          reference_range,
          critical_range,
          method,
          sample_type,
          status: "docpending",
        },
        { where: { test_id, patient_id: patientId } }
      );

      if (rowsUpdated === 0) {
        return res
          .status(404)
          .json({ message: "Test not found for this patient" });
      }

      return res.status(200).json({
        message: "Test result added successfully",
      });
    }
  } catch (error) {
    res.status(400).json({ message: `Something went wrong: ${error.message}` });
  }
};

// 3. Reject Report Entry
const rejectTests = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { test_results } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    if (!Array.isArray(test_results) || test_results.length === 0) {
      return res
        .status(400)
        .json({ message: "Provide at least one test to reject" });
    }

    let updatedCount = 0;

    for (const item of test_results) {
      const { test_id, rejection_reason } = item;

      if (!test_id) continue;

      const [rowsUpdated] = await PatientTest.update(
        {
          status: "reject",
          rejection_reason: rejection_reason || null,
        },
        {
          where: { test_id, patient_id: patientId },
        }
      );

      if (rowsUpdated > 0) updatedCount++;
    }

    if (updatedCount === 0) {
      return res.status(404).json({ message: "No matching tests found" });
    }

    return res.status(200).json({
      message: `Successfully rejected ${updatedCount} test(s)`,
    });
  } catch (error) {
    console.error("Error rejecting tests:", error);
    return res
      .status(500)
      .json({ message: `Something went wrong: ${error.message}` });
  }
};

// 4. Get Reject Report
const getRejectReport = async (req, res) => {
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
      if (!hospitalid) {
        return res
          .status(400)
          .json({ message: "Hospital ID is required for admin" });
      }
      targetHospitalId = parseInt(hospitalid);
    } else {
      if (parseInt(hospitalid) !== req.user.hospitalid) {
        return res.status(403).json({
          message: "Access denied. Hospital ID mismatch.",
        });
      }
      targetHospitalId = req.user.hospitalid;
    }

    const hospital = await Hospital.findOne({
      where: { id: targetHospitalId },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    /* 3. Pagination Details */
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    /* 4. Get current date in 'YYYY-MM-DD' format */
    // const currentDate = new Date()
    //   .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
    //   .split(",")[0];

    /* 5. Query patients with investigations where test_collection is "Yes" */
    const { count, rows } = await Patient.findAndCountAll({
      where: {
        // p_regdate: currentDate,
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
          where: { status: "reject" },
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
              where: { test_collection: "Yes" },
              attributes: [
                "testname",
                "shortcode",
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
        message: "No patients found with center status tests for today.",
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
    res.status(500).json({ message: `Something went wrong :${error}` });
  }
};

module.exports = {
  reportEntry,
  getCenterTestData,
  rejectTests,
  getRejectReport,
};
