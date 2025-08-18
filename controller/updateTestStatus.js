const { PatientTest } = require("../model/associationModels/associations");


// 1. Update the Patient Test Status by Patient

const updateTestStatus = async (req, res) => {
  try {
    const { patient_ids } = req.body;
    // Validate input
    if (!Array.isArray(patient_ids) || patient_ids.length === 0) {
      return res.status(400).json({ message: "Select Patients to send " });
    }
    const [updateTest] = await PatientTest.update(
      { status: "node" },
      {
        where: {
          patient_id: patient_ids,
        },
      }
    );
    return res.status(200).json({
      message: "Patient test status updated successfully",
      data: updateTest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Something went wrong while updating the status.",
    });
  }
};

// F. Get Tests By Test Codes

module.exports = {
  updateTestStatus,
};
