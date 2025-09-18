const { Investigation } = require("../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Short Code Of Investigations

const getShortCodes = async (req, res) => {
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
};

const searchTest = async (req, res) => {
  try {
    /* 1. Authorization */
    const { role } = req.user;
    if (
      role?.toLowerCase() !== "phlebotomist" &&
      role?.toLowerCase() !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Only phlebotomists and admins can access this resource.",
      });
    }

    /* 2. Query Parameters */
    const { shortcodes, testname } = req.query;
    const filters = {};

    if (shortcodes) {
      filters["shortcode"] = parseInt(shortcodes);
    }
    if (testname) {
      filters["testname"] = {
        [Op.iLike]: `%${testname}%`,
      };
    }

    /* Find Patients Matching the Query */
    const test = await Investigation.findAll({
      where: filters,
      order: [["id", "ASC"]],
      attributes: ["id", "testname", "shortcode", "normalprice"],
    });

    return res.status(200).json(test);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching tests ${error}`,
    });
  }
};

module.exports = {
  getShortCodes,
  searchTest,
};
