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

// A. Create Patient Test Along with Patient Registration
const addPatient = async (req, res) => {
  try {
    // 1. Check if the user is authenticated and has a hospitalid
    const { id: user_id, hospitalid } = req.user;

    // 2. Validate the Hospital Is available or not

    const hospital = await Hospital.findByPk(hospitalid);
    if (!hospital) {
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

    // Set Condition

    // 4. Create Patient Registration
    const createPatient = await Patient.create({
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
    });

    /// Get the Patient ID
    const patient_id = createPatient.id;

    console.log("Patient ID-------------:", patient_id);

    // 3. Check the Investigation Is available or not
    const investigations = await Investigation.findAll({
      where: {
        id: {
          [Op.in]: investigation_ids,
        },
      },
    });

    if (
      !investigations.length ||
      investigations.length !== investigation_ids.length ||
      !opbill ||
      !opbill.length ||
      !pptest ||
      !pptest.length ||
      !abha ||
      !abha.length
    ) {
      return res.status(201).json({
        message: "Patient Created Successfully . No test added. No bill added",
      });
    } else {
      // 4. Create Patient Test Order for PPMode
      const patienttests = investigation_ids.map((investigation_id) => ({
        patient_id,
        investigation_id,
        hospitalid,
        status: "center",
      }));

      // 5. Create Patient Test With Bill

      await PatientTest.bulkCreate(patienttests);

      // 6. Create Bill Records
      const billRecords = opbill.map((bill) => ({
        ...bill,
        patient_id,
        hospitalid,
      }));

      await OPBill.bulkCreate(billRecords);

      // 7.Create in PPPMode
      const ppData = pptest.map((pp) => ({
        ...pp,
        patient_id,
        hospitalid,
      }));

      await PPPMode.bulkCreate(ppData);

      // 8. Create in ABHA
      const abhaData = abha.map((ab) => ({
        ...ab,
        patient_id,
      }));

      await ABHA.bulkCreate(abhaData);

      return res.status(201).json({
        message:
          "Patient Details Created Successfully. Tests added. Bill Generated",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Some error occurred while creating the patient test order: ${err}`,
    });
  }
};

module.exports = {
  addPatient,
};
