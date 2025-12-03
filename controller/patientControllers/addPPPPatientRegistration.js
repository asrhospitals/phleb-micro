const {
  Patient,
  Investigation,
  PatientTest,
  Hospital,
  PPPMode,
  ABHA,
  Nodal,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const { generateRegId } = require("../../utils/idGenerator");

const addPPPPatientWithTest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    /* 1. Authorization , Check if the user is authenticated and has a Hospitalid and Nodalid*/
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

    /* 2. Request Body */

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
      pptest,
      abha,
    } = req.body;

    /* 3. Pre-check Investigations */
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

    
   /* 5. Validate Abha Duplicates (Abha/ AAdhar) */
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

    /* 5. Create Patient Record & Generate UHID */
    const uhid = await generateRegId(city);

    const patientData = {
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
      hospitalid: hospitalid,
      nodalid: nodalid,
      UHID: uhid,
    };

    const createPatient = await Patient.create(patientData, { transaction });
    const pid = createPatient.id;

    /* 6. Create Associated Records using Bulk Creation */

    // Prepare data for associations (pid is added automatically if using association methods)
    const patienttests = investigation_ids.map((investigation_id) => ({
      investigation_id,
      hospitalid,
      nodalid,
      status: "center",
      pid,
    }));

    // Prepare ABHA data
    const abhaData = abha.map((ab) => ({
      // Assuming ABHA model fields are directly mapped from the request body 'abha' array objects
      ...ab,
      pid,
    }));

    // Prepare PP Data
    const ppData = pptest.map((pp) => ({
      ...pp,
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
      message: "PPP Registration successful.",
      UHID: uhid,
    });
  } catch (err) {
    if (transaction.finished !== "committed") {
      await transaction.rollback();
    }
    console.error("Error in addPPPPatientWithTest:", err);
    res.status(500).json({
      message: "Something went wrong during registration.",
      error: err.message || err,
    });
  }
};

module.exports = {
  addPPPPatientWithTest,
};
