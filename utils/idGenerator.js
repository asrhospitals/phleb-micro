const Patient = require("../model/relationalModels/patient");

// Simple UHID generators during patient creation . Format : ORG/LOC/YEAR/SEQUENCE
const { Op } = require("sequelize");
/* Generate UHID Custom Format */
const generateRegId = async (city) => {
  // Normalize city to first 3 letters, uppercase
  const LOCATION = city ? city.substring(0, 3).toUpperCase() : "UNK";

  // Current year (last two digits)
  const year = new Date().getFullYear().toString().slice(-2);

  // Find the last patient for this city and year
  const lastPatient = await Patient.findOne({
    where: {
      city: { [Op.iLike]: city }, // match city
      createdAt: {
        [Op.gte]: new Date(new Date().getFullYear(), 0, 1), // start of current year
        [Op.lt]: new Date(new Date().getFullYear() + 1, 0, 1), // start of next year
      },
    },
    order: [["id", "DESC"]],
  });

  // Organization code (could be from config/env)
  const ORG = "ASR";

  // Generate a random number between 1 and 9,999,999
  const randomNumber = Math.floor(Math.random() * 9999999) + 1;

  // Sequence padded to 7 digits with prefix "O"
  const sequence = `${randomNumber.toString().padStart(7, "0")}`;

  // Final format: ORG/LOCATION/YEAR/SEQUENCE
  return `${ORG}/${LOCATION}/${year}/${sequence}`;
};

/*Generate Barcode Custom Format */
const generateBarcode = async (reg_id) => {
  const visitCount = await Visit.count({ where: { reg_id } });
  const nextVisit = visitCount + 1;

  return `V${nextVisit.toString().padStart(4, "0")}`; // V0001, V0002, etc.
};

module.exports = { generateRegId, generateBarcode };
