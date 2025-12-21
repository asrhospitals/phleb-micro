const {
  Patient,
  OPBill,
  OPPaymentDetail,
  InvDetail,
  Investigation,
  PPPMode,
  Hospital,
  ABHA,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

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
    const { id } = req.params;

    // 1. Verify Patient Existence
    const getPatient = await Patient.findByPk(id);
    if (!getPatient) {
      return res.status(404).json({ message: `Patient not found by id: ${id}` });
    }

    const rawData = req.body.opbill?.[0];
    if (!rawData) return res.status(400).json({ message: "No billing data provided" });

    // 2. DATA WHITELISTING (Prevents "unnecessary data")
    // We only extract the fields we explicitly want to save.
    const sanitizedBillData = {
      ptotal: parseFloat(rawData.ptotal || 0),
      pdisc_percentage: parseFloat(rawData.pdisc_percentage || 0),
      pdisc_amount: parseFloat(rawData.pdisc_amount || 0),
      pamt_receivable: parseFloat(rawData.pamt_receivable || 0),
      pamt_received_total: parseFloat(rawData.pamt_received_total || 0),
      pamt_due: parseFloat(rawData.pamt_due || 0),
      pamt_mode: rawData.pamt_mode,
      pnote: rawData.pnote,
      billstatus: rawData.billstatus || "Unpaid",
      review_status: rawData.review_status,
      review_days: parseInt(rawData.review_days || 0),
      // Clean the JSONB arrays to only include specific keys
      paymentDetails: Array.isArray(rawData.paymentDetails) 
        ? rawData.paymentDetails.map(p => ({ 
            method: p.payment_method, 
            amount: parseFloat(p.payment_amount) 
          })) 
        : [],
      invDetails: Array.isArray(rawData.invDetails) 
        ? rawData.invDetails.map(inv => ({ 
            inv_name: inv.inv_name, 
            price: parseFloat(inv.unit_price || 0),
            qty: parseInt(inv.quantity || 1),
            total: parseFloat(inv.final_amount || 0)
          })) 
        : []
    };

    const currentDate = new Date().toISOString().split("T")[0];

    // 3. Find Today's Open Bill
    const getExistingBill = await OPBill.findOne({
      where: {
        pid: id,
        bill_date: currentDate,
        billstatus: { [Op.in]: ["Unpaid", "Due"] },
      },
    });

    if (getExistingBill) {
      // Update existing record with sanitized data
      await getExistingBill.update(sanitizedBillData);
      return res.status(200).json({ message: "Bill updated successfully" });
    } else {
      // Create new record for today
      await OPBill.create({
        pid: id,
        bill_date: currentDate,
        ...sanitizedBillData,
      });
      return res.status(201).json({ message: "Bill created successfully" });
    }

  } catch (err) {
    // 4. Error Handling (Keep your existing Sequelize error logic)
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      const validationErrors = err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ message: "Validation error", errors: validationErrors });
    }

    console.error("Critical Billing Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updatePatientInfo,
  updateBillData,
};
