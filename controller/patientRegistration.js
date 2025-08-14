const { Patient } = require("../model/associationModels/associations");

// 1. General Patient Registration
const createPatient = async (req, res) => {
  try {
    // A. Check The valid user login or not
    const { id: user_id, hospitalid } = req.user;

    // B. Create Patient Demographic Data
    const patient = await Patient.create({
      ...req.body,
      hospitalid,
      created_by: user_id,
    });

    // C. Return the created patient data
    return res.status(201).json(patient);

  } catch (error) {
    res.status(500).send({
      message: `Some error occurred while creating patient info: ${error}`,
    });
  }
};


// 2. Get General Patient Info
const getPatinet = async (req, res) => {
  try {
    //get patient data by current date
    // Get current date in 'YYYY-MM-DD' format
    const currentDate = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    const patient = await Patient.findAll({ where: { pregdate: currentDate } });
    res.status(200).json(patient);
  } catch (err) {
    res.status(400).send({
      message: `Some error occurred while fetching the patient details: ${err}`,
    });
  }
};


module.exports={ createPatient,getPatinet};