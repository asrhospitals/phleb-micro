const { DataTypes } = require("sequelize");
const sequelize = require("../../db/dbConnection");

const Investigation = sequelize.define("investigation", {
  /// Test Info
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  loniccode: {
    type: DataTypes.STRING,
  },
  cptcode: {
    type: DataTypes.STRING,
  },
  testname: {
    type: DataTypes.STRING,
    allowNull: false,
    unique:true,
  },
  testcategory: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shortname: {
    type: DataTypes.STRING,
  },
  shortcode: {
    type: DataTypes.INTEGER,
    unique:true
  },
  department: {
    type: DataTypes.STRING,
  },
  subdepartment: {
    type: DataTypes.STRING,
  },
  roletype: {
    type: DataTypes.STRING,
  },
  reporttype: {
    type: DataTypes.STRING,
  },
  sampletype: {
    type: DataTypes.STRING,
  },
  sampleqty: {
    type: DataTypes.STRING,
  },
  sampletemp: {
    type: DataTypes.STRING,
  },
  testmethod: {
    type: DataTypes.STRING,
  },
  instrumenttype: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  sac: {
    type: DataTypes.STRING,
  },
  order: {
    type: DataTypes.STRING,
  },
  derivedtest: {
    type: DataTypes.STRING,
  },
  extranaltest: {
    type: DataTypes.STRING,
  },
  containertype: {
    type: DataTypes.STRING,
  },
  seperateprint: {
    type: DataTypes.BOOLEAN,
  },
  qrcode: {
    type: DataTypes.BOOLEAN,
  },
  labreg: {
    type: DataTypes.BOOLEAN,
  },
  noheader: {
    type: DataTypes.BOOLEAN,
  },
  enableautoemail: {
    type: DataTypes.BOOLEAN,
  },
  enaautosms: {
    type: DataTypes.BOOLEAN,
  },
  enableautowhatsap: {
    type: DataTypes.BOOLEAN,
  },
  enableintermidiate: {
    type: DataTypes.BOOLEAN,
  },
  enablestags: {
    type: DataTypes.BOOLEAN,
  },
  showtext: {
    type: DataTypes.BOOLEAN,
  },

  ///---Test Price

  walkinprice: {
    type: DataTypes.FLOAT,
  },
  b2bprice: {
    type: DataTypes.FLOAT,
  },
  ppprice: {
    type: DataTypes.FLOAT,
  },
  govtprice: {
    type: DataTypes.FLOAT,
  },
  normalprice: {
    type: DataTypes.FLOAT,
  },

  // Output
  checkimage: {
    type: DataTypes.BOOLEAN,
  },

  template: {
    type: DataTypes.STRING,
  },
  checkoutsrc: {
    type: DataTypes.BOOLEAN,
  },

  // ------Accreditation

  acreeditionname: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  acreeditiondate: {
    type: DataTypes.ARRAY(DataTypes.DATE),
  },

  // ----Lab Consumables

  labconsumables: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  consumableitems: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
  },

  //---Barcode & Timinng
  barcodelngt: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  barcode: {
    type: DataTypes.INTEGER,
  },
  spbarcode: {
    type: DataTypes.STRING,
  },
  suffbarcode: {
    type: DataTypes.STRING,
  },
  tat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tatunit: {
    type: DataTypes.STRING,
  },
  stat: {
    type: DataTypes.STRING,
  },
  statunit: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },

  // Instructions
  instruction: {
    type: DataTypes.STRING,
  },
  interpretation: {
    type: DataTypes.STRING,
  },
  remark: {
    type: DataTypes.STRING,
  },
},{timestamps:false});

module.exports = Investigation;