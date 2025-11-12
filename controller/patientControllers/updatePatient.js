const { Patient } = require("../../model/associationModels/associations");

// 1. Update Patient Data
const updatePatientInfo = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update(req.body);
    return res.status(200).json({message:"Updated successfully"});
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};
module.exports = {
  updatePatientInfo,
};
