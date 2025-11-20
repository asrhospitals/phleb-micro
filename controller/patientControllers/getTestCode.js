const {
  Investigation,
  Department,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Investigation By Codes or Test Name

const searchTest = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roleType } = req.user;
    if (
      roleType?.toLowerCase() !== "phlebotomist" &&
      roleType?.toLowerCase() !== "admin" &&
      roleType?.toLowerCase() !== "reception"
    ) {
      return res.status(403).json({
        message: "Access denied.Unauthorized user.",
      });
    }

    /* 2. Query Parameters */
    const { shortcodes, testname } = req.query;
    const filters = {};
    // Require at least one filter for a meaningful search
    if (!shortcodes && !testname) {
      return res.status(400).json({
        message: "Must provide a search parameter (testname or shortcode).",
      });
    }
    const orFilters = [];

    if (shortcodes) {
      const shortcodeArray = shortcodes.split(",").map((code) => code.trim());
      orFilters.push({
        shortcode: { [Op.in]: shortcodeArray },
      });
    }

    if (testname) {
      const testnameArray = testname.split(",").map((name) => name.trim());
      // Case-insensitive "starts with" search for progressive typing
      orFilters.push({
        testname: {
          [Op.or]: testnameArray.map((name) => ({
            [Op.iLike]: `${name}%`,
          })),
        },
      });
    }

    /* Find Patients Matching the Query */
    const test = await Investigation.findAll({
      where: { [Op.or]: orFilters },
      order: [["id", "ASC"]],
      attributes: ["id", "testname", "shortcode", "normalprice"],
      include: [
        {
          model: Department,
          attributes: ["dptname"],
        },
      ],
    });

    if (test.length === 0) {
      return res.status(404).json({ message: "No matching tests found." });
    }

    return res.status(200).json(test);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching tests ${error}`,
    });
  }
};

module.exports = {
  searchTest,
};
