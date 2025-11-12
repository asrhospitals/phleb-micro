const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
  Nodal
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const { generateRegId } = require("../../utils/idGenerator");

// A. Create Patient Test Along with Patient Registration
const addPatient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (roleType?.toLowerCase() !== "phlebotomist") {
      return res.status(403).json({
        message: "Access denied. Only phlebotomists can access this resource.",
      });
    }

    // 1. Check if the user is authenticated and has a hospitalid
    const { hospitalid,nodalid } = req.user;

    // 2. Validate the Hospital Is available or not

    const hospital = await Hospital.findByPk(hospitalid);
    if (!hospital) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Hospital name mismatch or not found. Please check the hospital name in the URL.`,
      });
    }

    const nodal=await Nodal.findByPk(nodalid);
    if(!nodal){
      await transaction.rollback();
      return res.status(400).json({
        message: `Nodal name mismatch or not found. Please check the nodal name in the URL.`,
      });
    }

    // 3. Generate Registration ID and Visit ID
    const reg_id = await generateRegId();

    // 4. Add Patient That Store in Patient Table And Patient Test Table via link with OP Bill and PPMode
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
      investigation_ids,
      opbill,
      pptest,
      abha,
    } = req.body;

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
        hospitalid: req.user.hospitalid,
        nodalid: req.user.nodalid,
        reg_id,
      },
      { transaction }
    );

    /// Get the Patient ID
    const patient_id = createPatient.id;

    // 5. Check if additional data is provided and valid
    const hasAdditionalData =
      investigation_ids &&
      investigation_ids.length &&
      opbill &&
      opbill.length &&
      pptest &&
      pptest.length;

    if (!hasAdditionalData) {
      // Commit the transaction with just patient creation
      await transaction.commit();
      return res.status(201).json({
        message: "Patient Created Successfully. No test added. No bill added",
      });
    }

    // 6. Validate investigations exist
    const investigations = await Investigation.findAll({
      where: {
        id: {
          [Op.in]: investigation_ids,
        },
      },
      transaction,
    });

    if (
      !investigations.length ||
      investigations.length !== investigation_ids.length
    ) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Some investigations not found or invalid investigation IDs provided",
      });
    }

    // 7. Validate Existing barcodes,popno,pipno,trfno
    // const existingPPM = await PPPMode.findAll({
    //   where: {
    //     [Op.or]: [
    //       { pbarcode: { [Op.in]: pptest.map((pp) => pp.pbarcode) } },
    //       { popno: { [Op.in]: pptest.map((pp) => pp.popno) } },
    //       { trfno: { [Op.in]: pptest.map((pp) => pp.trfno) } },
    //     ],
    //   },
    //   transaction,
    // });

    if (existingPPM.length) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Some PP Mode entries have duplicate barcodes or numbers or trfno or ip no",
      });
    }

    // 8. Validate Abha Data
    const existingABHA = await ABHA.findAll({
      where: {
        [Op.or]: [
          { aadhar: { [Op.in]: abha.map((ab) => ab.aadhar) } },
          { abha: { [Op.in]: abha.map((ab) => ab.abha) } },
        ],
      },
      transaction,
    });

    if (existingABHA.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Some ABHA entries have duplicate fields",
      });
    }

    // 9. Create Patient Test Orders
    const patienttests = investigation_ids.map((investigation_id) => ({
      patient_id,
      investigation_id,
      hospitalid,
      nodalid,
      status: "center",
    }));

    await PatientTest.bulkCreate(patienttests, { transaction });

    // 10. Create Bill Records
    const billRecords = opbill.map((bill) => ({
      ...bill,
      patient_id,
    }));

    await OPBill.bulkCreate(billRecords, { transaction });

    // 11. Create PPPMode records
    const ppData = pptest.map((pp) => ({
      ...pp,
      patient_id,
    }));

    await PPPMode.bulkCreate(ppData, { transaction });

    // 12. Create ABHA records
    const abhaData = abha.map((ab) => ({
      ...ab,
      patient_id,
    }));

    await ABHA.bulkCreate(abhaData, { transaction });

    // Commit the transaction if all operations succeed
    await transaction.commit();

    return res.status(201).json({
      message: "Patient Details Created Successfully. Tests added. Bill added",
    });
  } catch (err) {
    // Rollback transaction on any error
    await transaction.rollback();
    // Sequelize validation or unique constraint error
    if (
      err.name === "SequelizeUniqueConstraintError" ||
      err.name === "SequelizeValidationError"
    ) {
      const errorDetails = err.errors?.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      }));

      return res.status(400).json({
        message:
          "Validation error occurred while creating the patient test order.",
        errorType: err.name,
        details: errorDetails,
      });
    }

    // Other unexpected errors
    return res.status(500).json({
      message:
        "Unexpected error occurred while creating the patient test order.",
      error: err.message,
    });
  }
};



// 2. Add Patient As Per Hospital for admin

const createPatient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (roleType?.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only Admins can access this resource.",
      });
    }

    // 1. Generate Registration ID and Visit ID
    const reg_id = await generateRegId();

    // 2. Add Patient That Store in Patient Table And Patient Test Table via link with OP Bill and PPMode
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
      hospitalid,
      investigation_ids,
      opbill,
      pptest,
      abha,
    } = req.body;

    // 3. Create Patient Registration within transaction
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
        hospitalid,
        reg_id,
      },
      { transaction }
    );

    /// Get the Patient ID
    const patient_id = createPatient.id;

    // 4. Check if additional data is provided and valid
    const hasAdditionalData =
      investigation_ids &&
      investigation_ids.length &&
      opbill &&
      opbill.length &&
      pptest &&
      pptest.length;

    if (!hasAdditionalData) {
      // Commit the transaction with just patient creation
      await transaction.commit();
      return res.status(201).json({
        message: "Patient Created Successfully. No test added. No bill added",
      });
    }

    // 5. Validate investigations exist
    const investigations = await Investigation.findAll({
      where: {
        id: {
          [Op.in]: investigation_ids,
        },
      },
      transaction,
    });

    if (
      !investigations.length ||
      investigations.length !== investigation_ids.length
    ) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Some investigations not found or invalid investigation IDs provided",
      });
    }

    // 6. Validate Existing barcodes,popno,pipno,trfno
    const existingPPM = await PPPMode.findAll({
      where: {
        [Op.or]: [
          { pbarcode: { [Op.in]: pptest.map((pp) => pp.pbarcode) } },
          { popno: { [Op.in]: pptest.map((pp) => pp.popno) } },
          { trfno: { [Op.in]: pptest.map((pp) => pp.trfno) } },
        ],
      },
      transaction,
    });

    if (existingPPM.length) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Some PP Mode entries have duplicate barcodes or numbers or trfno or ip no",
      });
    }

    // 7. Validate Abha Data
    const existingABHA = await ABHA.findAll({
      where: {
        [Op.or]: [
          { aadhar: { [Op.in]: abha.map((ab) => ab.aadhar) } },
          { abha: { [Op.in]: abha.map((ab) => ab.abha) } },
        ],
      },
      transaction,
    });

    if (existingABHA.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Some ABHA entries have duplicate fields",
      });
    }

    // 8. Create Patient Test Orders
    const patienttests = investigation_ids.map((investigation_id) => ({
      patient_id,
      investigation_id,
      hospitalid,
      status: "center",
    }));

    await PatientTest.bulkCreate(patienttests, { transaction });

    // 9. Create Bill Records
    const billRecords = opbill.map((bill) => ({
      ...bill,
      patient_id,
    }));

    await OPBill.bulkCreate(billRecords, { transaction });

    // 10. Create PPPMode records
    const ppData = pptest.map((pp) => ({
      ...pp,
      patient_id,
    }));

    await PPPMode.bulkCreate(ppData, { transaction });

    // 11. Create ABHA records
    const abhaData = abha.map((ab) => ({
      ...ab,
      patient_id,
    }));

    await ABHA.bulkCreate(abhaData, { transaction });

    // Commit the transaction if all operations succeed
    await transaction.commit();

    return res.status(201).json({
      message: "Patient Details Created Successfully. Tests added. Bill added",
    });
  } catch (err) {
    await transaction.rollback();
    // Sequelize validation or unique constraint error
  if (err.name === "SequelizeUniqueConstraintError" || err.name === "SequelizeValidationError") {
    const errorDetails = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));

    return res.status(400).json({
      message: "Validation error occurred while creating the patient test order.",
      errorType: err.name,
      details: errorDetails,
    });
  }

  // Other unexpected errors
  return res.status(500).json({
    message: "Unexpected error occurred while creating the patient test order.",
    error: err.message,
  });


  }
};

module.exports = {
  addPatient,
  createPatient,
};
