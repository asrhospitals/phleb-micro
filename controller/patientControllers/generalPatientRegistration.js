const {
  Patient,
  Hospital,
  ABHA,
  Nodal,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const { generateRegId } = require("../../utils/idGenerator");

/* 3. General Registration */
const addGeneralPatientRegistration = async (req, res) => {
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
      abha,
    } = req.body;
    /* 3. Create Patient Record & Generate UHID */
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

    // Prepare Abha Data
    // Prepare ABHA data
    const abhaData = abha.map((ab) => ({
      // Assuming ABHA model fields are directly mapped from the request body 'abha' array objects
      ...ab,
      pid,
    }));

    await Promise.all([ABHA.bulkCreate(abhaData, { transaction })]);

    /* 4. Commit Transaction and Respond */
    await transaction.commit();
    res.status(201).json({
      message: "General Registration successful.",
      UHID: uhid,
    });
  } catch (err) {
    if (transaction.finished !== "committed") {
      await transaction.rollback();
    }
    console.error("Error in addGeneralPatientRegistration:", err);
    res.status(500).json({
      message: "Something went wrong during registration.",
      error: err.message || err,
    });
  }
};

module.exports = { addGeneralPatientRegistration };
