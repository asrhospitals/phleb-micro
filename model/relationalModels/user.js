const { DataTypes } = require('sequelize');
const sequelize=require('../../db/dbConnection');
const Hospital=require('../relationalModels/hospital');
const Nodal=require('../relationalModels/nodal');

const User=sequelize.define('user',{
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    username:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    role:{
        type:DataTypes.ENUM('admin','reception','doctor','technician','phlebotomist'),
        allowNull:false,
    },
    module:{
        type:DataTypes.STRING,
        allowNull:false
    },
    firstName:{
        type:DataTypes.STRING,
        allowNull:false
    },
    lastname:{
        type:DataTypes.STRING
    },
    email:{
        type:DataTypes.STRING
    },
    menuexpand:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    },
    isactive:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    },
    hospitalid: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow null for admin users
        references: {
          model:Hospital,
          key: 'id',
        },
        onDelete: 'SET NULL', // If a hospital is deleted, set this field to NULL
      },
      nodalid: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow null for admin users
        references: {
          model:Nodal,
          key: 'id',
        },
        onDelete: 'CASCADE', // If a hospital is deleted, set this field to NULL
      },
}, {
    timestamps: false,
  
  });

Hospital.hasMany(User, { foreignKey: 'hospitalid' });
User.belongsTo(Hospital, { foreignKey: 'hospitalid' });

Nodal.hasMany(User, { foreignKey: 'nodalid' });
User.belongsTo(Nodal, { foreignKey: 'nodalid' });

Nodal.hasMany(Hospital, { foreignKey: 'nodalid' });
Hospital.belongsTo(Nodal, { foreignKey: 'nodalid' });




module.exports=User;