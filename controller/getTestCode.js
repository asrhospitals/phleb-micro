const { Investigation } = require("../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Investigation By Codes or Test Name

const searchTest = async (req, res) => {
  try {
    /* 1. Authorization */
    const { roletype } = req.user;
    if (
      roletype?.toLowerCase() !== "phlebotomist" &&
      roletype?.toLowerCase() !== "admin"
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
  searchTest,
};
