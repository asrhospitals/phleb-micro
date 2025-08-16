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
const addPatientTest = async (req, res) => {
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

// B. Get All Patient Tests along with Patient details and Hospital name

const getPatientTest = async (req, res) => {
  try {
    // Check if the user is authenticated and has a hospitalid
    const { hospitalid } = req.user;

    // Need Details By hospital Name
    const { hospitalname } = req.params;

    // Get current date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    // Get Hospital Details by Name
    const hospital = await Hospital.findOne({
      where: { id: hospitalid, hospitalname: hospitalname },
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Get all Patient Tests details by Hospital ID and Current Date
    const patientTests = await PatientTest.findAll({
      where: { hospitalid: hospital.id },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: [
            "id",
            "pname",
            "page",
            "pgender",
            "pregdate",
            "pmobile",
            "registration_status",
          ],
          where: { pregdate: currentDate },

          include: [
            {
              model: ABHA,
              as: "patientAbhas",
              attributes: [
                "id",
                "isaadhar",
                "ismobile",
                "aadhar",
                "mobile",
                "abha",
              ],
            },
            {
              model: OPBill,
              as: "patientBills",
              attributes: ["id", "ptotal", "pamt", "pamtmode", "pamtmthd"],
            },
            {
              model: PPPMode,
              as: "patientPPModes",
              attributes: ["id", "pscheme", "refdoc", "remark", "attatchfile"],
            },
          ],
        },
        {
          model: Investigation,
          as: "investigation",
          attributes: ["id", "testname", "department"],
        },
        {
          model: Hospital,
          as: "hospital",
          attributes: ["hospitalname"],
        },
      ],
    });

    // Check if any patient tests were not found

    if (!patientTests.length) {
      return res
        .status(404)
        .json({ message: "No patient tests found for today." });
    }
    // Group tests by patient_id using forEach
    const groupedByPatient = {};

    patientTests.forEach((test) => {
      const patientId = test.patient_id;
      const plainTest = test.get({ plain: true });

      if (!groupedByPatient[patientId]) {
        groupedByPatient[patientId] = {
          patient_id: patientId,
          pname: plainTest.patient.pname,
          page: plainTest.patient.page,
          pregdate: plainTest.patient.pregdate,
          mobile: plainTest.patient.pmobile,
          registration_status: plainTest.patient.registration_status,
          pgender: plainTest.patient.pgender,
          hospital_name: plainTest.hospital.hospitalname,
          tests: [],
          bills: plainTest.patient.patientBills || [],
          ppdata: plainTest.patient.patientPPModes || [],
          abha_data: plainTest.patient.patientAbhas || [],
        };
      }

      groupedByPatient[patientId].tests.push({
        patient_test_id: plainTest.patient_test_id,
        investigation_id: plainTest.investigation_id,
        testname: plainTest.investigation.testname,
        department: plainTest.investigation.department,
        status: plainTest.status,
        rejection_reason: plainTest.rejection_reason,
        createdAt: plainTest.createdAt,
        updatedAt: plainTest.updatedAt,
      });
    });

    // Convert to array
    const groupedResults = Object.values(groupedByPatient);

    res.status(200).json(groupedResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message:
        err.message || "Something went wrong while fetching patient tests.",
    });
  }
};

// D. Update Patient Deatails by Patient ID
const updatePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update(req.body);
    return res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// E. Update the Patient Test Status by Patient

const updateTestStatus = async (req, res) => {
  try {
    const { patient_ids } = req.body;
    // Validate input
    if (!Array.isArray(patient_ids) || patient_ids.length === 0) {
      return res.status(400).json({ message: "Select Patients to send " });
    }
    const [updateTest] = await PatientTest.update(
      { status: "node" },
      {
        where: {
          patient_id: patient_ids,
        },
      }
    );
    return res.status(200).json({
      message: "Patient test status updated successfully",
      data: updateTest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Something went wrong while updating the status.",
    });
  }
};

// F. Get Tests By Test Codes

const getShortCode=async (req,res) => {
  try {
    const { short_codes } = req.body;

    if (!Array.isArray(short_codes) || short_codes.length === 0) {
      return res.status(400).json({ message: "Invalid test shortcodes" });
    }

    const tests = await Investigation.findAll({
      where: {
        shortcode: short_codes,
      },
    });
     if (tests.length === 0) {
      return res.status(404).json({ message: "No matching tests found" });
    }

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
  
}

module.exports = {
  addPatientTest,
  getPatientTest,
  updatePatient,
  updateTestStatus,
  getShortCode,
};
