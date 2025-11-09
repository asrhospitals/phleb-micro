const {
  PatientTest,
  Investigation,
} = require("../../model/associationModels/associations");

// 1. Update the Patient Test Status by Patient

const updateTestStatus = async (req, res) => {
  try {
    const { patient_ids } = req.body;

    // Validate input
    if (!Array.isArray(patient_ids) || patient_ids.length === 0) {
      return res.status(400).json({ message: "Select Patients to send" });
    }

    // Step 1: Find tests with patient_ids AND investigation.test_collection = "No"
    const tests = await PatientTest.findAll({
      where: { patient_id: patient_ids },
      include: [
        {
          model: Investigation,
          as: "investigation",
          where: { test_collection: "No" },
          attributes: [],
        },
      ],
    });

    if (!tests || tests.length === 0) {
      return res
        .status(404)
        .json({ message: "No eligible tests found (test_collection = No)" });
    }

    // Step 2: Extract the matching test_ids
    const testIds = tests.map((t) => t.id);

    // Step 3: Update only those PatientTests
    await PatientTest.update(
      { status: "node" },
      { where: { id: testIds } }
    );

    return res.status(200).json({
      message: "Patient Tests sent to Node Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: `Something went wrong while updating the status: ${err.message}`,
    });
  }
};

module.exports = {
  updateTestStatus,
};
