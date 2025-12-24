const {
  Patient,
  OPBill,
  OPPaymentDetail,
  InvDetail,
  Investigation,
  PPPMode,
  Hospital,
  ABHA,
  PatientTest,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");
const sequelize = require("../../db/dbConnection");

// 1. Update Patient Data
const updatePatientInfo = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update(req.body);
    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// 2. Update Patient Bill Data
/*Need to Update the bill need to add the Inv Ids also */
const updateBillData = async (req, res) => {
  try {
    const { patientId, billId } = req.params;

    // 1. Verify Patient Existence
    const getPatient = await Patient.findByPk(patientId);
    if (!getPatient) {
      return res
        .status(404)
        .json({ message: `Patient not found by id: ${patientId}` });
    }

    // 2. Verify the Bill Id
    const getBill = await OPBill.findByPk(billId);
    if (!getBill) {
      return res
        .status(400)
        .json({ message: `Bill not found by id: ${billId}` });
    }

    // 3. Update Bill Record
    await OPBill.update(req.body, {
      where: {
        id: billId,
        pid: patientId,
        billstatus: { [Op.in]: ["Unpaid", "Due"] },
      },
    });

    // 4. Return Success Response
    return res.status(200).json({ message: "Bill updated successfully" });
  } catch (err) {
    // 5. Error Handling (Keep your existing Sequelize error logic)
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      const validationErrors = err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res
        .status(400)
        .json({ message: "Validation error", errors: validationErrors });
    }

    console.error("Critical Billing Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. Update Patient Test Data
// (This function can be implemented similarly with proper data whitelisting and error handling)
const updatePatientTestData = async (req, res) => {
  try {
    // Get the patient by ID
    const { id } = req.params;
    // Check if patient exists
    const patient = await Patient.findByPk(id);
    // If patient not found, return 404
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // get some variables
    const pid = id;
    const hospitalid = req.user.hospitalid;
    const nodalid = req.user.nodalid;
    const { investigation_ids } = req.body;

    // Now check investigation_ids = [] is empty or not if empty then add test for the patient

    if (investigation_ids.length > 0) {
      const patienttests = investigation_ids.map((investigation_id) => ({
        pid,
        investigation_id,
        hospitalid,
        nodalid,
        status: "center",
      }));
    }

    res.status(200).json({ message: "Test data updated successfully" });
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

module.exports = {
  updatePatientInfo,
  updateBillData,
  updatePatientTestData,
};
