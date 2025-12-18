const {
  Patient,
  OPBill,
  OPPaymentDetail,
  InvDetail,
  Investigation,
  PPPMode,
  Hospital,
  ABHA
} = require("../../model/associationModels/associations");

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
const updateBillData = async (req, res) => {
  try {
    // Get Patient Id
    const { id } = req.params;
    // check that patient available or not
    const getPatient = await Patient.findByPk(id, {
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
            "review_status",
            "review_days",
          ],
          include: [
            {
              model: OPPaymentDetail,
              as: "Payments",
              attributes: ["op_bill_id", "payment_method", "payment_amount"],
            },

            {
              model: InvDetail,
              as: "investigationDetails", // Alias for InvDetail
              attributes: [
                "inv_id",
                "unit_price",
                "quantity",
                "discount_amount",
                "discount_percentage",
                "final_amount",
              ],
              // ADDED: Include the Investigation model to get the test name
              include: [
                {
                  model: Investigation,
                  as: "investigation", // Assuming the InvDetail association alias to Investigation is 'investigation'
                  attributes: ["testname"],
                },
              ],
            },
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
    });
    if (!getPatient)
      return res
        .status(404)
        .json({ message: `Patient not found by this ${id} ` });
    //now check that patient have bill or not

    // if (!findBill.opBills.length === 0)
    //   return res
    //     .status(404)
    //     .json({ message: "Bill not found for this Patient " });

    res.status(200).json({ message: "Patient found", data: getPatient });
  } catch (err) {
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      // Extract detailed messages
      const validationErrors = err.errors.map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    console.error("Error creating investigation:", err);
    res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = {
  updatePatientInfo,
  updateBillData,
};
