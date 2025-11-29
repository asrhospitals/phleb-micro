const {
  Investigation,
  Department,
  Profile,
  ProfileEntry,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Investigation By Codes or Test Name

const searchTest = async (req, res) => {
  // try {
  //   /* 1. Authorization (Unchanged) */
  //   const { roleType } = req.user;
  //   if (
  //     roleType?.toLowerCase() !== "phlebotomist" &&
  //     roleType?.toLowerCase() !== "admin" &&
  //     roleType?.toLowerCase() !== "reception"
  //   ) {
  //     return res.status(403).json({
  //       message: "Access denied.Unauthorized user.",
  //     });
  //   }

  //   /* 2. Query Parameters */
  //   const { shortcodes, testname, profilecodes, profilename } = req.query;

  //   // Must provide at least one search filter across both models
  //   if (!shortcodes && !testname && !profilecodes && !profilename) {
  //     return res.status(400).json({
  //       message:
  //         "Must provide a search parameter (testname, shortcode, profilename, or profilecode).",
  //     });
  //   }

  //   // --- Search Investigation Model ---
  //   let investigations = [];
  //   if (shortcodes || testname) {
  //     const investigationFilters = [];

  //     if (shortcodes) {
  //       const shortcodeArray = shortcodes.split(",").map((code) => code.trim());
  //       investigationFilters.push({
  //         shortcode: { [Op.in]: shortcodeArray },
  //       });
  //     }

  //     if (testname) {
  //       const testnameArray = testname.split(",").map((name) => name.trim());
  //       investigationFilters.push({
  //         testname: {
  //           [Op.or]: testnameArray.map((name) => ({
  //             [Op.iLike]: `${name}%`, // Case-insensitive "starts with"
  //           })),
  //         },
  //       });
  //     }

  //     // Execute Investigation search
  //     investigations = await Investigation.findAll({
  //       where: { [Op.or]: investigationFilters },
  //       order: [["id", "ASC"]],
  //       attributes: ["id", "testname", "shortcode", "normalprice"],
  //       include: [
  //         {
  //           model: Department,
  //           attributes: ["dptname"],
  //         },
  //       ],
  //       // Note: I removed the ProfileMaster include here, as you indicated it's a separate model to be searched.
  //     });
  //   }

  //   // --- Search ProfileMaster Model ---
  //   let profiles = [];
  //   if (profilecodes || profilename) {
  //     const profileFilters = [];

  //     if (profilecodes) {
  //       const profilecode = profilecodes.trim();
  //       if (profilecode) {
  //         profileFilters.push({
  //           profilecode: { [Op.iLike]: profilecode }, // Case-insensitive exact match
  //         });
  //       }
  //     }
  //     if (profilename) {
  //       // *** MODIFIED BLOCK FOR SINGLE PROFILE NAME SEARCH ***
  //       const profileNameSearchTerm = profilename.trim();
  //       if (profileNameSearchTerm) {
  //         profileFilters.push({
  //           profilename: {
  //             [Op.iLike]: `${profileNameSearchTerm}%`, // Case-insensitive "starts with"
  //           },
  //         });
  //       }
  //     }

  //     // Execute Profile search

  //     profiles = await ProfileEntry.findAll({
  //       where: { [Op.or]: profileFilters },
  //       order: [["id", "ASC"]],
  //       attributes: ["profilename", "profilecode"],
  //       // You might want to include nested models for ProfileMaster here if applicable
  //       include: [
  //         {
  //           model: Profile,
  //           as: "profiles",
  //           include: [
  //             {
  //               model: Investigation,
  //               as: "investigations_in_profile",
  //               attributes: ["id", "testname", "shortcode", "normalprice"],
  //               include: [
  //                 {
  //                   model: Department,
  //                   attributes: ["dptname"],
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       ],
  //     });
  //   }

  //   /* 3. Combine and Respond */
  //   const combinedResults = [...investigations, ...profiles];

  //   if (combinedResults.length === 0) {
  //     return res
  //       .status(404)
  //       .json({ message: "No matching tests or profiles found." });
  //   }

  //   return res.status(200).json(combinedResults);
  // } catch (error) {
  //   // Note: The error message is now generic since two models are being queried
  //   return res.status(500).json({
  //     message: `Something went wrong while searching: ${error.message}`,
  //   });
  // }
};

module.exports = {
  searchTest,
};
