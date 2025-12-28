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
const updatePatientDemographicInfo = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findByPk(patient_id, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update(req.body, { transaction });
    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// 2. Update Patient Bill Data
/*Need to Update the bill need to add the Inv Ids also */

const updateCurrentBillData = async (req, res) => {
  let transaction = null;

  try {
    // 1. Start Transaction
    transaction = await sequelize.transaction();
    const { patientId, billId } = req.params;

    // 2. Find the bill
    const existingBill = await OPBill.findOne({
      where: { id: billId, pid: patientId },
      transaction,
    });

    if (!existingBill) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ message: "Bill not found" });
    }

    /**
     * Logic Change: 
     * If bill_status is 'due', the user can update regardless of time.
     * Otherwise (e.g., 'paid', 'cancelled'), apply the 24-hour limit.
     */
    const isDue = existingBill.billstatus === 'due';
    const billDate = new Date(existingBill.bill_date).getTime();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (!isDue && (now - billDate > oneDayInMs)) {
      if (transaction) await transaction.rollback();
      return res.status(403).json({ 
        message: "Update period expired. Only 'due' bills can be updated after 24 hours." 
      });
    }

    // if (now - billDate > oneDayInMs) {
    //   if (transaction) await transaction.rollback();
    //   return res.status(403).json({ message: "Update period expired (24h limit)." });
    // }

    // 4. Clean the incoming data 
    // We destructure to ensure primary keys (id, pid) are never overwritten by req.body
    const { id, pid, ...updateData } = req.body;

    // 5. Apply changes and Save
    // The fixed logic: update() handles both assigning data and saving in one go.
    await existingBill.update(updateData, { transaction });

    // 6. Commit and Return
    await transaction.commit();

    return res.status(200).json({
      message: "Bill updated successfully",
     
    });

  } catch (err) {
    // 7. Robust Error Handling
    if (transaction) await transaction.rollback();
    
    console.error("Critical Update Error:", err);
    
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// 3. Add bill and test for existing patient if the patient is already registered
const updateQuickBillAndTestForExistingPatient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { patientId } = req.params;

    // 1. Verify Patient Existence
    const getPatient = await Patient.findByPk(patientId, { transaction });
    if (!getPatient) {
      await transaction.rollback();
      return res.status(404).json({ message: `Patient not found` });
    }

    // 2. Get Current Date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // 3. Verify Bill Existence for the Patient in current date.
    // If yes then they cannot use this route.
    // If Bill Is 24hour old allow them to use this route
    const existingBill = await OPBill.findOne({
      where: { pid: patientId, bill_date: currentDate },
      transaction,
    });
    if (existingBill) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Bill already exists for patient. Use the update bill instead.`,
      });
    }
    // 3. Verify Test Existence for the Patient in current date.
    // If yes then they cannot use this route.
    // If the test is 24hour old allow them to use this route
    const existingTest = await PatientTest.findOne({
      where: { pid: patientId, test_created_date: currentDate },
      transaction,
    });
    if (existingTest) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Test already exists for patient. Use the update test instead.`,
      });
    }

    // 3. Update Patient Data with investigation_ids:[],opBill:[],ppTest:[]
    const {
      p_regdate,
      p_regtime,
      investigation_ids = [],
      opbill = [],
      pptest = [],
    } = req.body;
    // 4. Update Patient Record
    await Patient.update(
      { p_regdate, p_regtime, investigation_ids, opbill, pptest },
      {
        where: { id: patientId },
        transaction,
      }
    );

    return res.status(200).json({ message: "Patient updated successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// const updateCurrentBillData = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { patientId, billId } = req.params;

//     const existingBill = await OPBill.findOne({
//       where: { id: billId, pid: patientId },
//       transaction,
//     });

//     if (!existingBill) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Bill not found" });
//     }

//     const { id, pid, invDetails, ...updateData } = req.body;

//     // 1. 24‑Hour cutoff unless billstatus is "Due"
//     if (existingBill.billstatus !== "Due") {
//       const billDate = new Date(existingBill.bill_date).getTime();
//       if (Date.now() - billDate > 24 * 60 * 60 * 1000) {
//         await transaction.rollback();
//         return res.status(403).json({ message: "Update period expired (24h)." });
//       }
//     }

//     // 2. Assign new values to bill
//     Object.assign(existingBill, updateData);

//     // 3. Update invDetails if provided
//     if (invDetails) {
//       existingBill.invDetails = invDetails;

//       // Auto‑derive investigation_ids from invDetails
//       const investigationIds = invDetails.map(inv => inv.inv_id ?? inv.id).filter(Boolean);

//       // Update patient record with new investigation_ids
//       await Patient.update(
//         { investigation_ids: investigationIds },
//         { where: { id: patientId }, transaction }
//       );
//     }

//     // 4. Save bill (this persists changes)
// const updatedBill = await existingBill.save({ transaction });

//     await transaction.commit();

//     return res.status(200).json({
//       message: "Bill updated successfully",
//       bill: updatedBill,
//     });
//   } catch (err) {
//     if (transaction) await transaction.rollback();
//     console.error("Update Error:", err);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

module.exports = {
  updatePatientDemographicInfo,
  updateCurrentBillData,
  updateQuickBillAndTestForExistingPatient,
};
