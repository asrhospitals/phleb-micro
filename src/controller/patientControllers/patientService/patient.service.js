const {
  Patient,
  OPBill,
  PPPMode,
  PatientTest,
  ABHA,
  Investigation,
  Hospital,
  Nodal,
  Department,
  Result,
  DerivedTestComponent,
} = require("../../../model/associationModels/associations");

const { generateRegId } = require("../../../utils/idGenerator");
const sequelize = require("../../../db/dbConnection");
const { Op } = require("sequelize");
const emailQueue = require("../../../queue/emailQueue");

// --- New Helper Function (Add this near the top of your service file) ---
async function fetchTestNames(investigationIds, transaction) {
  if (!investigationIds || investigationIds.length === 0) return "N/A";

  // Fetch the investigation records using the IDs
  const investigations = await Investigation.findAll({
    where: { id: { [Op.in]: investigationIds } },
    attributes: ["testname"], // Fetch only the name field
    transaction,
  });

  // Map the results to a comma-separated string
  return investigations.map((inv) => inv.testname || "Test").join(", ");
}

/**
 * Executes all necessary business logic to register a patient, optionally with bill and tests.
 * @param {object} userData - Hospital/Nodal context from the authenticated user.
 * @param {object} patientData - All patient, bill, and test data from the request body.
 * @returns {string} The newly generated Universal Health ID (UHID).
 * @throws {Error} If any business rule is violated or a database operation fails.
 */
async function createPatientRegistration(userData, patientData) {
  const transaction = await sequelize.transaction();
  const { hospitalid, nodalid } = userData;

  try {
    // --- 1. Basic User/Context Validation ---
    await validateUserContext(hospitalid, nodalid, transaction);

    // --- 2. Request Data Decomposition and Validation ---
    const {
      investigation_ids = [],
      opbill = [],
      pptest = [],
      abha = [],
      ...restPatientData
    } = patientData;

    // --- Conditional Validation based on presence of data ---
    if (investigation_ids.length > 0) {
      // 1st Check: Ensure no duplicate IDs in the request array itself
      validateUniqueInvestigationIds(investigation_ids);
      // 2nd Check: Validate investigation IDs exist in the database
      await validateInvestigationsExistence(investigation_ids, transaction);
    }

    if (opbill.length > 0) {
      // Bill is present, validate bill structure
      validateBillingData(opbill);
    }

    if (pptest.length > 0 || abha.length > 0) {
      // PPP or ABHA data is present, run duplication checks
      await checkDuplicates(pptest, abha, transaction);
    }

    // --- 3. Generate IDs and Create Patient ---
    const uhid = await generateRegId(restPatientData.city);
    const createPatient = await Patient.create(
      {
        ...restPatientData,
        hospitalid,
        nodalid,
        uhid: uhid,
      },
      { transaction }
    );
    const pid = createPatient.id;

    // --- 4. Prepare and Execute Conditional Bulk Creations ---
    const bulkOperations = [];

    // A. Create Bill, Payments, and Line Items (CONDITIONAL)
    if (opbill.length > 0) {
      const billData = opbill[0];
      bulkOperations.push(createBillingRecords(pid, billData, transaction));
    }

    // B. Create Test, PPP, and ABHA Records (CONDITIONAL)
    if (investigation_ids.length > 0 || pptest.length > 0 || abha.length > 0) {
      bulkOperations.push(
        createTestAndIdRecords(
          pid,
          hospitalid,
          nodalid,
          investigation_ids,
          pptest,
          abha,
          transaction
        )
      );
    }

    // Execute all necessary bulk operations
    await Promise.all(bulkOperations);

    // ---  ASYNCHRONOUS EMAIL NOTIFICATION INTEGRATION ---

    const isOptedIn = restPatientData.p_email_alart;
    const recipientEmail = restPatientData.p_email;

    if (isOptedIn && recipientEmail) {
      // --- 5A. Determine Registration Type ---
      let regType = "GENERAL";

      const hasBill = opbill.length > 0;
      const hasTests = investigation_ids.length > 0;
      const hasPPP = pptest.length > 0;

      let notificationDetails = {};

      // --- PRE-FETCH TEST NAMES IF ANY TESTS EXIST ---
      let testNamesString = "N/A";
      if (hasTests) {
        // This relies on the fetchTestNames helper function being available and correctly defined
        testNamesString = await fetchTestNames(investigation_ids, transaction);
      }

      if (hasBill && hasTests) {
        // BILL_TEST (Highest Priority)
        const billData = opbill[0];

        notificationDetails = {
          regType: "BILL_TEST",
          testDetails: {
            // FIX APPLIED: Use the pre-fetched string for consistency
            // testname: testNamesString,
            appointmentDate: restPatientData.p_regdate,
            location: hospitalid,
          },
          billDetails: {
            amount: billData.pamt_receivable || billData.pamtrcv,
          },
        };
      } else if (hasTests && hasPPP) {
        // PPP_TEST (Second Highest Priority)
        notificationDetails = {
          regType: "PPP_TEST",
          testDetails: {
            // testname: testNamesString, // Already using the fetched string
            appointmentDate: restPatientData.p_regdate,
            location: hospitalid,
          },
        };
      } else {
        // GENERAL (Fallback)
        notificationDetails = { regType: "GENERAL" };
      }

      // --- 5B. Enqueue the Job ---
      const patientName = `${restPatientData.p_title || ""} ${
        restPatientData.p_name
      } ${restPatientData.p_lname || ""}`;

      await emailQueue.add("registrationEmail", {
        to: recipientEmail,
        name: patientName,
        username: uhid,
        ...notificationDetails,
      });

      console.log(
        `Email job enqueued for ${notificationDetails.regType} registration (UHID: ${uhid}).`
      );
    }

    await transaction.commit();
    return uhid;
  } catch (err) {
    if (transaction.finished !== "committed") {
      await transaction.rollback();
    }
    // Re-throw the error so the Controller can handle the response
    throw err;
  }
}

/**
 * @description Retrieves a paginated list of patients for a specific hospital, filtered by today's registration date.
 * @param {number} targetHospitalId - The ID of the hospital to filter by.
 * @param {object} queryParams - Contains 'page' and 'limit' for pagination.
 * @returns {object} An object containing patient data and pagination metadata.
 * @throws {Error} If the hospital ID is invalid or a database query fails.
 */
async function getPatientsByHospitalId(targetHospitalId, queryParams) {
  // 1. Validate Hospital Existence
  const hospital = await Hospital.findOne({
    where: { id: targetHospitalId },
  });

  if (!hospital) {
    // Throw a specific error that the controller can translate to 404
    throw new Error("Hospital not found");
  }

  // 2. Pagination Details
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  // 3. Get current date in 'YYYY-MM-DD' format (assuming this format is used in the DB)
  const currentDate = new Date()
    .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
    .split(",")[0];

  // 4. Find Patient with nested includes and pagination
  const { count, rows } = await Patient.findAndCountAll({
    where: {
      p_regdate: currentDate,
      hospitalid: targetHospitalId,
      reg_by: "Center",
    },

    // The complex include structure is moved entirely to the service
    include: [
      {
        model: ABHA,
        as: "patientAbhas",
        attributes: ["isaadhar", "ismobile", "aadhar", "mobile", "abha"],
      },
      {
        model: OPBill,
        as: "patientBills",
        attributes: [
          "id",
          "ptotal",
          "pdisc_percentage",
          "pdisc_amount",
          "pamt_receivable",
          "pamt_received_total",
          "pamt_due",
          "pamt_mode",
          "pnote",
          "gstin",
          "billstatus",
          "paymentDetails",
          "invDetails",
          "review_status",
          "review_days",
          "bill_date",
        ],
        order: [["id", "DESC"]],
      },
      {
        model: PPPMode,
        as: "patientPPModes",
        attributes: [
          "pscheme",
          "refdoc",
          "remark",
          "attatchfile",
          "pbarcode",
          "trfno",
          "pop",
          "popno",
        ],
      },
      {
        model: PatientTest,
        as: "patientTests",
        where: { status: "center" }, // Filter by status
        required: false, // Patients can exist without a current 'center' test
        attributes: [
          "id",
          "status",
          "rejection_reason",
          "test_created_date",
          "test_updated_date",
          "test_result",
          "test_image",
        ],
        include: [
          {
            model: Investigation,
            as: "investigation",
            // where: { test_collection: "No" }, // Filter investigations
            attributes: [
              "testname",
              "testmethod",
              "sampletype",
              "test_collection",
              "shortname"
            ],
            include: [
              {
                model: Department,
                as: "department",
                attributes: ["dptname"],
              },
              { model: Result, as: "results", attributes: ["unit"] },
              {
                model: DerivedTestComponent,
                as: "components",
                attributes: ["formula"],
                include: [
                  {
                    model: Investigation,
                    as: "childTest",
                    attributes: ["testname"],
                    include: [
                      {
                        model: Result,
                        as: "results",
                        attributes: ["unit"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { model: Hospital, as: "hospital", attributes: ["hospitalname"] },
    ],
    limit: limit,
    offset: offset,
    order: [["id", "DESC"]],
    distinct: true,
    col: "id",
  });

  if (!rows || rows.length === 0) {
    return {
      data: [],
      totalItems: 0,
      itemsPerPage: limit,
      currentPage: page,
      totalPages: 0,
      limit: limit,
      page: page,
    };
  }

  const totalPages = Math.ceil(count / limit);

  return {
    data: rows,
    totalItems: count,
    itemsPerPage: limit,
    currentPage: page,
    totalPages: totalPages,
    limit: limit,
    page: page,
  };
}

/**
 * @description Retrieves a paginated list of patients and their active tests (PPP mode only)
 * for a specific hospital, filtered by today's registration date.
 * @param {number} targetHospitalId - The ID of the hospital to filter by.
 * @param {object} queryParams - Contains 'page' and 'limit' for pagination.
 * @returns {object} An object containing patient test data and pagination metadata.
 * @throws {Error} If the hospital is not found or no data is available.
 */
async function getPatientTestData(targetHospitalId, queryParams) {
  // 1. Validate Hospital Existence
  const hospital = await Hospital.findOne({
    where: { id: targetHospitalId },
  });

  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // 2. Pagination Details
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  // 3. Get current date in 'YYYY-MM-DD' format
  const currentDate = new Date()
    .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
    .split(",")[0];

  // 4. Find Patient with nested includes and pagination (Moved from controller)
  const { count, rows } = await Patient.findAndCountAll({
    where: {
      p_regdate: currentDate,
      hospitalid: targetHospitalId,
    },
    attributes: [
      "id",
      "p_name",
      "p_age",
      "p_gender",
      "p_regdate",
      "p_lname",
      "p_mobile",
      "u_name",
      "uhid",
    ],
    include: [
      {
        model: PPPMode,
        as: "patientPPModes",
        required: true, // Only fetch Patients who have a PPP mode record
        attributes: [
          "id",
          "remark",
          "attatchfile",
          "pbarcode",
          "trfno",
          "pop",
          "popno",
        ],
      },
      {
        model: PatientTest,
        as: "patientTests",
        where: { status: "center" }, // Filter by status
        required: false, // Patients can exist without a current 'center' test
        attributes: [
          "id",
          "status",
          "rejection_reason",
          "test_created_date",
          "test_updated_date",
          "test_result",
          "test_image",
        ],
        include: [
          {
            model: Investigation,
            as: "investigation",
            where: { test_collection: "No" }, // Filter investigations
            attributes: [
              "testname",
              "testmethod",
              "sampletype",
              "test_collection",
            ],
            include: [
              {
                model: Department,
                as: "department",
                attributes: ["dptname"],
              },
              { model: Result, as: "results", attributes: ["unit"] },
              {
                model: DerivedTestComponent,
                as: "components",
                attributes: ["formula"],
                include: [
                  {
                    model: Investigation,
                    as: "childTest",
                    attributes: ["testname"],
                    include: [
                      {
                        model: Result,
                        as: "results",
                        attributes: ["unit"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: Hospital,
        as: "hospital",
        attributes: ["hospitalname"],
      },
    ],
    limit: limit,
    offset: offset,
    order: [["id", "DESC"]],
    subQuery: false,
    distinct: true,
    col: "id",
  });

  if (!rows || rows.length === 0) {
    throw new Error("No data available for the given hospital and date.");
  }

  const totalPages = Math.ceil(count / limit);

  return {
    data: rows,
    totalItems: count,
    itemsPerPage: limit,
    currentPage: page,
    totalPages: totalPages,
    limit: limit,
    page: page,
  };
}

// ==========================================================
// --- VALIDATION AND HELPER FUNCTIONS ---
// ==========================================================

async function validateUserContext(hospitalid, nodalid, transaction) {
  const [hospital, nodal] = await Promise.all([
    Hospital.findByPk(hospitalid, { transaction }),
    Nodal.findByPk(nodalid, { transaction }),
  ]);

  if (!hospital || !nodal) {
    throw new Error(
      "Invalid Hospital ID or Nodal ID associated with the user."
    );
  }
}

// 1. New Check: Enforce uniqueness within the request array
function validateUniqueInvestigationIds(investigation_ids) {
  const uniqueIds = new Set(investigation_ids);
  if (uniqueIds.size !== investigation_ids.length) {
    throw new Error(
      "Duplicate investigation IDs found in the request. Each investigation ID must be unique."
    );
  }
}

async function validateInvestigationsExistence(investigation_ids, transaction) {
  const investigations = await Investigation.findAll({
    where: { id: { [Op.in]: investigation_ids } },
    attributes: ["id"],
    transaction,
  });

  if (investigations.length !== investigation_ids.length) {
    throw new Error("One or more investigation IDs are invalid or not found.");
  }
}

function validateBillingData(opbill) {
  if (!Array.isArray(opbill) || opbill.length === 0) {
    throw new Error("Bill is required."); // Should not happen if opbill.length > 0, but good for safety
  }

  const billData = opbill[0];
  const { paymentDetails } = billData;

  // VALIDATION CHANGE: Ensure paymentDetails exists and is a non-empty array if payment mode is 'Multiple'
  if (
    billData.pamt_mode === "Multiple" &&
    (!Array.isArray(paymentDetails) || paymentDetails.length === 0)
  ) {
    throw new Error("Multiple payment mode requires payment details.");
  }
}

async function checkDuplicates(pptest, abha, transaction) {
  // Check PPP Duplicates (Only if pptest is provided)
  if (pptest.length > 0) {
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
      const conflictingValues = duplicateCheck.map((d) => ({
        pbarcode: d.pbarcode,
        popno: d.popno,
        trfno: d.trfno,
      }));
      throw new Error(
        JSON.stringify({
          message: "Duplicate entry detected in PBarcode, Pop No, or TRF No.",
          conflicts: conflictingValues,
        })
      );
    }
  }

  // Check ABHA Duplicates (Only if abha is provided)
  if (abha.length > 0) {
    const duplicateAbhaCheck = await ABHA.findAll({
      where: {
        [Op.or]: [
          { aadhar: { [Op.in]: abha.map((ab) => ab.aadhar).filter(Boolean) } },
          { abha: { [Op.in]: abha.map((ab) => ab.abha).filter(Boolean) } },
        ],
      },
      transaction,
    });
    if (duplicateAbhaCheck.length) {
      const conflictingValues = duplicateAbhaCheck.map((d) => ({
        aadhar: d.aadhar,
        abha: d.abha,
      }));
      throw new Error(
        JSON.stringify({
          message: "Duplicate entry detected in Abha, Aadhar, or Abha No.",
          conflicts: conflictingValues,
        })
      );
    }
  }
}

async function createBillingRecords(pid, billData, transaction) {
  // Logic to prepare mainBillRecord
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
    paymentDetails: billData.paymentDetails,
    invDetails: billData.invDetails,
    billstatus: billData.billstatus,
    gstin: billData.gstin, // New field from image
    bill_date: billData.bill_date || new Date(),
    review_status: billData.review_status, // New field from image
    review_days: billData.review_days, // New field from image
    pid: pid, // Link to the new Patient ID
    // Note: Remove pamtmthd and pamtrcv, which are now in OPPaymentDetail
  };

  const createdOPBill = await OPBill.create(mainBillRecord, { transaction });
  // const op_bill_id = createdOPBill.id;

  // const bulkOperations = [];

  // // 1. Payment Details
  // if (paymentDetails && paymentDetails.length > 0) {
  //   const paymentRecords = paymentDetails.map((payment) => ({
  //     op_bill_id: op_bill_id,
  //     payment_method: payment.payment_method || payment.pamtmthd,
  //     payment_amount: payment.payment_amount || payment.pamt,
  //   }));
  //   bulkOperations.push(
  //     OPPaymentDetail.bulkCreate(paymentRecords, { transaction })
  //   );
  // }

  // // 2. Inv Details (Line Items)
  // if (invDetails.length > 0) {
  //   const invData = invDetails.map((inv) => ({
  //     ...inv,
  //     op_bill_id: op_bill_id,
  //   }));
  //   bulkOperations.push(InvDetail.bulkCreate(invData, { transaction }));
  // }

  // await Promise.all(bulkOperations);
  return createdOPBill;
}

async function createTestAndIdRecords(
  pid,
  hospitalid,
  nodalid,
  investigation_ids,
  pptest,
  abha,
  transaction
) {
  const bulkOperations = [];

  // 1. Patient Tests (If investigation_ids are provided)
  if (investigation_ids.length > 0) {
    const patienttests = investigation_ids.map((investigation_id) => ({
      pid,
      investigation_id,
      hospitalid,
      nodalid,
      status: "center",
    }));
    bulkOperations.push(PatientTest.bulkCreate(patienttests, { transaction }));
  }

  // 2. PPPMode records (If pptest is provided)
  if (pptest.length > 0) {
    const ppData = pptest.map((pp) => ({ ...pp, pid }));
    bulkOperations.push(PPPMode.bulkCreate(ppData, { transaction }));
  }

  // 3. ABHA records (If abha is provided)
  if (abha.length > 0) {
    const abhaData = abha.map((ab) => ({ ...ab, pid }));
    bulkOperations.push(ABHA.bulkCreate(abhaData, { transaction }));
  }

  return Promise.all(bulkOperations);
}

module.exports = {
  createPatientRegistration,
  getPatientsByHospitalId,
  getPatientTestData,
};
