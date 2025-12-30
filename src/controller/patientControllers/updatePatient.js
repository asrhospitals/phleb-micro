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
    await transaction.commit();
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
    const isDue = existingBill.billstatus === "Due";
    const billDate = new Date(existingBill.bill_date).getTime();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (!isDue && now - billDate > oneDayInMs) {
      if (transaction) await transaction.rollback();
      return res.status(403).json({
        message:
          "Update period expired. Only 'due' bills can be updated after 24 hours.",
      });
    }

    // 4. Clean the incoming data
    // We destructure to ensure primary keys (id, pid) are never overwritten by req.body
    const { id, pid, ...updateData } = req.body;

    // 5. Apply changes and Save
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

// 3. Add bill and test for existing patient if the patient is already registered as general patient
const updateQuickBillAndTestForGenPatient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // 1. Verify Patient Existence
    const getPatient = await Patient.findByPk(id, {
      where: { p_flag: 0 },
      transaction,
    });
    if (!getPatient) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ message: `Patient not found or not a general patient` });
    }

    // 2. Get Current Date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // 3. Verify Bill Existence for the Patient in current date.
    // If yes then they cannot use this route.
    // If Bill Is 24hour old allow them to use this route
    const existingBill = await OPBill.findOne({
      where: { pid: id, bill_date: currentDate },
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
      where: { pid: id, test_created_date: currentDate },
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
      p_reg_time,
      investigation_ids = [],
      opbill = [],
      pptest = [],
      p_flag,
    } = req.body;
    // 4. Update Patient Record
    await Patient.update(
      {
        p_regdate,
        p_reg_time,
        p_flag,
      },
      {
        where: { id: id },
        transaction,
      }
    );
    // 5. Create Investigation Records

    const bulkOperations = [];

    if (investigation_ids.length > 0) {
      const patienttests = investigation_ids.map((investigation_id) => ({
        pid: id,
        investigation_id,
        hospitalid: req.user.hospitalid,
        nodalid: req.user.nodalid,
        status: "center",
      }));
      bulkOperations.push(
        PatientTest.bulkCreate(patienttests, { transaction })
      );
    }

    // 6. Create OP Bill Records
    if (opbill.length > 0) {
      // If opbill is an array of bills, use bulkCreate
      await OPBill.bulkCreate(
        opbill.map((bill) => ({
          ...bill,
          pid: id,
          bill_date: currentDate,
        })),
        { transaction }
      );
    }

    // 7. Create PPP Test Records
    if (pptest.length > 0) {
      await PPPMode.bulkCreate(
        pptest.map((test) => ({
          ...test,
          pid: id,
          created_date: currentDate,
        })),
        { transaction }
      );
    }

    // 8. Commit Transaction
    await transaction.commit();

    // 9. Return Success Response
    return res.status(200).json({ message: "Patient updated successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// 4. Add Test to existing Patient within 24 hours of registration
const updateTestToExistingPatientWithin24Hours = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    // 1. Verify Patient Existence
    const getPatient = await Patient.findByPk(id, { transaction });
    if (!getPatient) {
      await transaction.rollback();
      return res.status(404).json({ message: `Patient not found` });
    }
    // 2. Check if within 24 hours of registration
    const registrationDate = new Date(getPatient.p_regdate);
    const currentDate = new Date();
    const timeDifference = currentDate - registrationDate;
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    if (hoursDifference > 24) {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          message: `Cannot add test. More than 24 hours since registration.`,
        });
    }
    // 3. Add Tests
    const { investigation_ids = [] } = req.body;

    const existingTests = await PatientTest.findAll({
      where: { pid: id },
      transaction,
    });

    const existingInvestigationIds = existingTests.map(
      (test) => test.investigation_id
    );

    // Check if all requested tests already exist
    const allExist = investigation_ids.every((id) =>
      existingInvestigationIds.includes(id)
    );
    if (allExist) {
      return res
        .status(400)
        .json({ message: "Tests already exist for this patient." });
    }

    // Filter out already existing ones
    const newInvestigationIds = investigation_ids.filter(
      (id) => !existingInvestigationIds.includes(id)
    );

    if (newInvestigationIds.length > 0) {
      const patienttests = newInvestigationIds.map((investigation_id) => ({
        pid: id,
        investigation_id,
        hospitalid: req.user.hospitalid,
        nodalid: req.user.nodalid,
        status: "center",
      }));
      await PatientTest.bulkCreate(patienttests, { transaction });
    }
    // 4. Commit Transaction
    await transaction.commit();
    // 5. Return Success Response
    return res.status(200).json({ message: "Tests added successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

module.exports = {
  updatePatientDemographicInfo,
  updateCurrentBillData,
  updateQuickBillAndTestForGenPatient,
  updateTestToExistingPatientWithin24Hours,
};
