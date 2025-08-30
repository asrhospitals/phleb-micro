const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  OPBill,
  PPPMode,
  ABHA,
} = require("../model/associationModels/associations");
const { Op } = require("sequelize");
const sequelize = require("../db/dbConnection");

// A. Create Patient Test Along with Patient Registration
const addPatient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Check if the user is authenticated and has a hospitalid
    const { id: user_id, hospital_id } = req.user;

    // 2. Validate the Hospital Is available or not

    const hospital = await Hospital.findByPk(hospital_id);
    if (!hospital) {
      await transaction.rollback();
      return res.status(200).json({ message: "Hospital not found." });
    }

    // 3. Add Patient That Store in Patient Table And Patient Test Table via link with OP Bill and PPMode
    const {
      country,
      ref,
      refdetails,
      pmobile,
      pregdate,
      ptitle,
      pname,
      plname,
      pgender,
      page,
      pyears,
      pmonth,
      pdays,
      pblood,
      pid,
      pidnum,
      pemail,
      pwhtsap,
      pguardian,
      pguardianmob,
      pguardadd,
      prltn,
      street,
      landmark,
      city,
      state,
      attatchfile,
      investigation_ids,
      opbill,
      pptest,
      abha,
    } = req.body;

    // 4. Create Patient Registration within transaction
    const createPatient = await Patient.create(
      {
        country,
        ref,
        refdetails,
        pmobile,
        pregdate,
        ptitle,
        pname,
        plname,
        pgender,
        page,
        pyears,
        pmonth,
        pdays,
        pblood,
        pid,
        pidnum,
        pemail,
        pwhtsap,
        pguardian,
        pguardianmob,
        pguardadd,
        prltn,
        street,
        landmark,
        city,
        state,
        attatchfile,
        hospitalid,
        created_by: user_id,
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
      pptest.length &&
      abha &&
      abha.length;

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

    // 7. Create Patient Test Orders
    const patienttests = investigation_ids.map((investigation_id) => ({
      patient_id,
      investigation_id,
      hospitalid,
      status: "center",
    }));

    await PatientTest.bulkCreate(patienttests, { transaction });

    // 8. Create Bill Records
    const billRecords = opbill.map((bill) => ({
      ...bill,
      patient_id,
      hospitalid,
    }));

    await OPBill.bulkCreate(billRecords, { transaction });

    // 9. Create PPPMode records
    const ppData = pptest.map((pp) => ({
      ...pp,
      patient_id,
      hospitalid,
    }));

    await PPPMode.bulkCreate(ppData, { transaction });

    // 10. Create ABHA records
    const abhaData = abha.map((ab) => ({
      ...ab,
      patientid,
    }));

    await ABHA.bulkCreate(abhaData, { transaction });

    // Commit the transaction if all operations succeed
    await transaction.commit();

    return res.status(201).json({
      message:
        "Patient Details Created Successfully. Tests added. Bill Generated",
      patient_id,
    });
  } catch (err) {
    // Rollback transaction on any error
    await transaction.rollback();
    res.status(500).send({
      message: `Some error occurred while creating the patient test order: ${err.message}`,
    });
  }
};

module.exports = {
  addPatient,
};
