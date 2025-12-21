const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");
const DerivedTestComponent = sequelize.define("derived_test_component", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parenttestid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "investigations",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  childtestid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "investigations",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  formula: {
    type: DataTypes.STRING, 
    // optional: e.g. "SUM" or "Direct + Indirect"
  }
},);

module.exports = DerivedTestComponent;