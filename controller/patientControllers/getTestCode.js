const {
  Investigation,
  Department,
  ProfileInv,
  ProfileMaster,
} = require("../../model/associationModels/associations");
const { Op } = require("sequelize");

// 1. Get Investigation By Codes or Test Name



const searchTest = async (req, res) => {
  try {
    // 1. Authorization
    const { roleType } = req.user;
    if (
      !["phlebotomist", "admin", "reception"].includes(roleType?.toLowerCase())
    ) {
      return res.status(403).json({ message: "Access denied. Unauthorized user." });
    }

    // 2. Query Parameters
    const { shortcodes, testname, profilecodes, profilename } = req.query;

    if (!shortcodes && !testname && !profilecodes && !profilename) {
      return res.status(400).json({
        message:
          "Must provide a search parameter (testname, shortcode, profilename, or profilecode).",
      });
    }

    // --- Search Investigations ---
    let investigations = [];
    if (shortcodes || testname) {
      const filters = [];

      if (shortcodes) {
        const shortcodeArray = shortcodes.split(",").map((c) => c.trim());
        filters.push({ shortcode: { [Op.in]: shortcodeArray } });
      }

      if (testname) {
        const testnameArray = testname.split(",").map((n) => n.trim());
        filters.push({
          testname: {
            [Op.or]: testnameArray.map((n) => ({ [Op.iLike]: `${n}%` })),
          },
        });
      }

      investigations = await Investigation.findAll({
        where: { [Op.or]: filters },
        order: [["id", "ASC"]],
        attributes: ["id", "testname", "shortcode", "normalprice"],
        include: [
          { model: Department, as: "department", attributes: ["dptname"] },
        ],
      });
    }

    // --- Search Profiles (resolve investigationids manually) ---
    let profiles = [];
    if (profilecodes || profilename) {
      const filters = [];

      if (profilecodes) {
        const profilecodeArray = profilecodes.split(",").map((c) => c.trim());
        filters.push({ profilecode: { [Op.in]: profilecodeArray } });
      }

      if (profilename) {
        const profilenameArray = profilename.split(",").map((n) => n.trim());
        filters.push({
          profilename: {
            [Op.or]: profilenameArray.map((n) => ({ [Op.iLike]: `${n}%` })),
          },
        });
      }

      const rawProfiles = await ProfileMaster.findAll({
        where: { [Op.or]: filters },
        order: [["id", "ASC"]],
        attributes: ["id", "profilename", "profilecode"],
        include: [
          {
            model: ProfileInv,
            as: "profileInvs",
            attributes: ["id", "profileid", "investigationids"], // <-- important
          },
        ],
      });

      // Resolve investigationids manually
      profiles = await Promise.all(
        rawProfiles.map(async (prof) => {
          let investigations = [];
          for (const pi of prof.profileInvs) {
            if (pi.investigationids?.length > 0) {
              const invs = await Investigation.findAll({
                where: { id: { [Op.in]: pi.investigationids } },
                attributes: ["id", "testname", "normalprice"],
                include: [
                  { model: Department, as: "department", attributes: ["dptname"] },
                ],
              });
              investigations.push(...invs);
            }
          }

          return {
            type: "profile",
            id: prof.id,
            profilename: prof.profilename,
            profilecode: prof.profilecode,
            investigations: investigations.map((inv) => ({
              id: inv.id,
              testname: inv.testname,
              normalprice: inv.normalprice,
              department: inv.department ? { dptname: inv.department.dptname } : null,
            })),
          };
        })
      );
    }

    // --- Reshape Investigations ---
    const investigationResults = investigations.map((inv) => ({
      type: "investigation",
      id: inv.id,
      testname: inv.testname,
      shortcode: inv.shortcode,
      normalprice: inv.normalprice,
      department: inv.department ? { dptname: inv.department.dptname } : null,
    }));

    // --- Combine ---
    const combinedResults = [...investigationResults, ...profiles];

    if (combinedResults.length === 0) {
      return res.status(404).json({ message: "No matching tests or profiles found." });
    }

    return res.status(200).json(combinedResults);
  } catch (error) {
    return res.status(500).json({
      message: `Something went wrong while searching: ${error.message}`,
    });
  }
};

module.exports = {
  searchTest,
};
