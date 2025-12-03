const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
  Nodal,
} = require("../../model/associationModels/associations");
const OPPaymentDetail=require("../../model/relationalModels/opPaymentDetails");
const { Op } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const { generateRegId } = require("../../utils/idGenerator");

/* 1. Create Patient Test Along with Patient Registration With Bill */
const addPatientWithBillAndTest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    /* 1. Authorization */
    const { roleType, hospitalid, nodalid } = req.user;

    if (roleType?.toLowerCase() !== "phlebotomist") {
      return res.status(403).json({
        message: "Access denied. Only phlebotomists can access this resource.",
      });
    }

    const [hospital, nodal] = await Promise.all([
      Hospital.findByPk(hospitalid, { transaction }),
      Nodal.findByPk(nodalid, { transaction }),
    ]);

    if (!hospital || !nodal) {
      // Rollback is implicitly handled by the return, but keep it explicit for safety.
      await transaction.rollback();
      return res.status(400).json({
        message:
          "User context error: Invalid Hospital ID or Nodal ID associated with the user.",
      });
    }

    /* 1. Request Body */
    const {
      u_name,
      country,
      ref_source,
      ref_details,
      p_mobile,
      p_regdate,
      p_title,
      p_name,
      p_lname,
      p_gender,
      p_age,
      p_years,
      p_month,
      p_days,
      p_blood,
      p_id,
      p_idnum,
      p_email,
      p_whtsap,
      p_guardian,
      p_guardianmob,
      p_guardadd,
      p_rltn,
      street,
      landmark,
      city,
      state,
      p_image,
      p_whtsap_alart,
      p_email_alart,
      p_pincode,
      investigation_ids,
      opbill,
      pptest,
      abha,
    } = req.body;

    /* 3. Pre-check Investigations, Bills, Barcode PPP Data */
    if (!Array.isArray(investigation_ids) || investigation_ids.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Investigation IDs are required." });
    }
    if (!Array.isArray(pptest) || pptest.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "PPP test data (pptest) is required." });
    }
    if (!Array.isArray(opbill) || opbill.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Bill is required." });
    }

    // Extract the single bill object from the array
    const billData = opbill[0];
    const paymentDetails = billData.paymentDetails;

    // VALIDATION CHANGE: Ensure paymentDetails exists and is a non-empty array if payment mode is 'Multiple'
    if (
      billData.pamt_mode === "Multiple" &&
      (!Array.isArray(paymentDetails) || paymentDetails.length === 0)
    ) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Multiple payment mode requires payment details." });
    }

    const investigations = await Investigation.findAll({
      where: { id: { [Op.in]: investigation_ids } },
      attributes: ["id"], // Select only ID for efficiency
      transaction,
    });

    if (investigations.length !== investigation_ids.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "One or more investigation IDs are invalid or not found.",
      });
    }

    /* 4. Validate PPP Duplicates (Barcode/Pop/TRF) */
    const duplicateCheck = await PPPMode.findAll({
      where: {
        [Op.or]: [
          {
            pbarcode: {
              [Op.in]: pptest.map((pp) => pp.pbarcode).filter(Boolean),
            },
          },
          { popno: { [Op.in]: pptest.map((pp) => pp.popno).filter(Boolean) } },
          { trfno: { [Op.in]: pptest.map((pp) => pp.trfno).filter(Boolean) } },
        ],
      },
      transaction,
    });

    if (duplicateCheck.length) {
      await transaction.rollback();
      // Provide specific details on the conflict for better debugging/user feedback
      const conflictingValues = duplicateCheck.map((d) => ({
        pbarcode: d.pbarcode,
        popno: d.popno,
        trfno: d.trfno,
      }));
      return res.status(400).json({
        message: "Duplicate entry detected in PBarcode, Pop No, or TRF No.",
        conflicts: conflictingValues,
      });
    }

    // Validated Abha Duplicates
    const duplicateAbhaCheck = await ABHA.findAll({
      where: {
        [Op.or]: [
          {
            aadhar: {
              [Op.in]: abha.map((ab) => ab.aadhar).filter(Boolean),
            },
          },
          { abha: { [Op.in]: abha.map((ab) => ab.abha).filter(Boolean) } },
        ],
      },
      transaction,
    });

    if (duplicateAbhaCheck.length) {
      await transaction.rollback();
      // Provide specific details on the conflict for better debugging/user feedback
      const conflictingValues = duplicateCheck.map((d) => ({
        aadhar: d.aadhar,
        abha: d.abha,
      }));
      return res.status(400).json({
        message: "Duplicate entry detected in Abha, Aadhar, or Abha No.",
        conflicts: conflictingValues,
      });
    }

    // 4. Generate Registration ID and Visit ID
    const uhid = await generateRegId(city);

    // 5. Create Patient Registration within transaction
    const createPatient = await Patient.create(
      {
        u_name,
        country,
        ref_source,
        ref_details,
        p_mobile,
        p_regdate,
        p_title,
        p_name,
        p_lname,
        p_gender,
        p_age,
        p_years,
        p_month,
        p_days,
        p_blood,
        p_id,
        p_idnum,
        p_email,
        p_whtsap,
        p_guardian,
        p_guardianmob,
        p_guardadd,
        p_rltn,
        street,
        landmark,
        city,
        state,
        p_image,
        p_whtsap_alart,
        p_email_alart,
        p_pincode,
        hospitalid: req.user.hospitalid,
        nodalid: req.user.nodalid,
        UHID: uhid,
      },
      { transaction }
    );

    /// Get the Patient ID
    const pid = createPatient.id;

    // 9. Create Patient Test Orders
    const patienttests = investigation_ids.map((investigation_id) => ({
      pid,
      investigation_id,
      hospitalid,
      nodalid,
      status: "center",
    }));

    /* 10. BILLING LOGIC: Create OPBill and OPPaymentDetail */

    const mainBillRecord = {
      // Only include fields that belong to the main OPBill model
      ptotal: billData.ptotal,
      pdisc_percentage: billData.pdisc_percentage || billData.pdisc, // Assuming pdisc_percentage is the new field
      pdisc_amount: billData.pdisc_amount || billData.pdisc, // Assuming pdisc_amount is the new field
      pamt_receivable: billData.pamt_receivable || billData.pamt,
      pamt_received_total: billData.pamt_received_total || billData.pamtrcv,
      pamt_due: billData.pamt_due || billData.pamtdue,
      pamt_mode: billData.pamt_mode,
      pnote: billData.pnote,
      billstatus: billData.billstatus,
      review_status: billData.review_status, // New field from image
      review_days: billData.review_days, // New field from image
      pid: pid, // Link to the new Patient ID
      // Note: Remove pamtmthd and pamtrcv, which are now in OPPaymentDetail
    };

    const createdOPBill = await OPBill.create(mainBillRecord, { transaction });
    const op_bill_id = createdOPBill.id;

    // 7c. Prepare and create the OPPaymentDetail records
    if (paymentDetails && paymentDetails.length > 0) {
      const paymentRecords = paymentDetails.map((payment) => ({
        op_bill_id: op_bill_id, // Link to the created OPBill
        payment_method: payment.payment_method || payment.pamtmthd, // Use new or old field name
        payment_amount: payment.payment_amount || payment.pamt, // Use new or old field name
      }));

      await OPPaymentDetail.bulkCreate(paymentRecords, { transaction });
    }

    // 11. Create PPPMode records
    const ppData = pptest.map((pp) => ({
      ...pp,
      pid,
    }));

    // 12. Create ABHA records
    const abhaData = abha.map((ab) => ({
      ...ab,
      pid,
    }));

    // Use bulkCreate on the associations for efficiency and consistency
    await Promise.all([
      PPPMode.bulkCreate(ppData, { transaction }),
      PatientTest.bulkCreate(patienttests, { transaction }),
      ABHA.bulkCreate(abhaData, { transaction }),
    ]);

    /* 7. Commit Transaction and Respond */
    await transaction.commit();
    res.status(201).json({
      message: "Patient Registered Successfully",
      UHID: uhid,
    });
  } catch (err) {
    if (transaction.finished !== "committed") {
      await transaction.rollback();
    }
    console.error("Error in addPatientWithBillAndTest:", err);
    res.status(500).json({
      message: "Something went wrong during registration.",
      error: err.message || err,
    });
  }
};

module.exports = { addPatientWithBillAndTest };
