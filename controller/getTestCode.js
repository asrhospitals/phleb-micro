const { Investigation } = require("../model/associationModels/associations");

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

module.exports = {
  getShortCodes,
};
