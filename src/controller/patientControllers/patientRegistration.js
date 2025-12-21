const patientService=require('./patientService/patient.service');

/**
 * @description Centralized error handler for all patient registration endpoints.
 * It detects JSON-encoded business errors (400) and internal errors (500).
 * @param {object} res - Express response object
 * @param {Error} err - Error object thrown by the service
 */
const handleServiceError = (res, err) => {
    console.error("Error in Patient Controller:", err);

    let statusCode = 500;
    let message = "Something went wrong during registration.";
    let errorDetails = err.message;

    // a) Handle JSON-encoded business/duplicate errors thrown by the Service
    try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.message.includes('Duplicate entry')) {
            statusCode = 400;
            message = parsedError.message;
            errorDetails = parsedError.conflicts; // Expose conflict details
        }
    } catch (e) {
        // Not a JSON error, proceed to check other specific errors
    }
    
    // b) Handle specific validation/context errors (Non-JSON errors)
    if (statusCode === 500 && (
        err.message.includes('Invalid Hospital ID') || 
        err.message.includes('required') || 
        err.message.includes('invalid') ||
        err.message.includes('Duplicate investigation IDs') || // First Check Rule
        err.message.includes('Multiple payment mode') ||
        err.message.includes('invalid or not found')
    )) {
        statusCode = 400;
        message = err.message;
        errorDetails = undefined;
    }


    res.status(statusCode).json({
      message: message,
      error: errorDetails,
    });
};


/**
 * @description Handles the POST request for a general patient registration (Patient + optional ABHA), 
 * leveraging the same flexible service without requiring bill, PPP, or test data.
 * This is perfect for the "General Registration (then no need of bill and ppp data)" scenario.
 * * @param {object} req - Express request object (contains user context and body data)
 * @param {object} res - Express response object
 */
const addGeneralPatientRegistration = async (req, res) => {
  /* 1. Authorization: Check User Role */
  const { roleType, hospitalid, nodalid } = req.user;

  if (roleType?.toLowerCase() !== "phlebotomist") {
    return res.status(403).json({
      message: "Access denied. Only phlebotomists can access this resource.",
    });
  }

  /* 2. Prepare Data for Service */
  const userData = { hospitalid, nodalid };
  // The service expects investigation_ids, opbill, pptest, and abha keys to manage conditional logic.
  // By passing req.body, the empty arrays are automatically handled as general registration
  const patientData = req.body; 

  try {
    /* 3. Execute Business Logic via Service Layer */
    const uhid = await patientService.createPatientRegistration(userData, patientData);

    /* 4. Respond to Client - Success */
    res.status(201).json({
      message: "General Registration successful.",
      UHID: uhid,
    
    });
  } catch (err) {
    handleServiceError(res, err);
  }
};


/**
 * @description Handles the POST request to register a new patient with all possible data 
 * (Patient, Bill, Tests, PPP/ABHA). This is perfect for the "Need registration with bill" scenario.
 * * @param {object} req - Express request object (contains user context and body data)
 * @param {object} res - Express response object
 */
const addPatientWithBillAndTest = async (req, res) => {
  /* 1. Authorization: Check User Role */
  const { roleType, hospitalid, nodalid } = req.user;

  if (roleType?.toLowerCase() !== "phlebotomist") {
    return res.status(403).json({
      message: "Access denied. Only phlebotomists can access this resource.",
    });
  }

  /* 2. Prepare Data for Service */
  const userData = { hospitalid, nodalid };
  const patientData = req.body; 

  try {
    /* 3. Execute Business Logic via Service Layer */
    const uhid = await patientService.createPatientRegistration(userData, patientData);

    /* 4. Respond to Client - Success */
    res.status(201).json({
      message: "Patient Registered Successfully",
      UHID: uhid,
    });
  } catch (err) {
    handleServiceError(res, err);
  }
};


/**
 * @description Handles the POST request for PPP (Public-Private Partnership) registration, 
 * which requires both investigation IDs and PPP test data.
 * Leverages the service layer for all complex logic, validation, and transactions.
 * @param {object} req - Express request object (contains user context and body data)
 * @param {object} res - Express response object
 */
const addPPPPatientWithTest = async (req, res) => {
  /* 1. Authorization: Check User Role */
  const { roleType, hospitalid, nodalid } = req.user;

  if (roleType?.toLowerCase() !== "phlebotomist") {
    return res.status(403).json({
      message: "Access denied. Only phlebotomists can access this resource.",
    });
  }

  /* 2. Prepare Data for Service */
  const userData = { hospitalid, nodalid };
  // The service handles mandatory checks for 'investigation_ids' and 'pptest' 
  // if 'opbill' is missing or empty, ensuring this specific flow is validated.
  const patientData = req.body; 

  try {
    /* 3. Execute Business Logic via Service Layer */
    const uhid = await patientService.createPatientRegistration(userData, patientData);

    /* 4. Respond to Client - Success */
    res.status(201).json({
      message: "PPP Registration successful.",
      UHID: uhid,
    });
  } catch (err) {
    handleServiceError(res, err);
  }
};



module.exports = {
  addPatientWithBillAndTest,
  addGeneralPatientRegistration,
  addPPPPatientWithTest
};
