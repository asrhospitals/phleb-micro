const { DataTypes } = require('sequelize');
const sequalize=require('../../db/dbConnection');

const Hospital=sequalize.define('hospitalmaster',{
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    hospitalname:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    hsptltype:{
        type:DataTypes.STRING,
        allowNull:false
    },
    address:{
        type:DataTypes.STRING,
        allowNull:false
    },
    city:{
        type:DataTypes.STRING,
        allowNull:false
    },
    district:{
        type:DataTypes.STRING,
        allowNull:false
    },
    pin:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    states:{
        type:DataTypes.STRING,
        allowNull:false
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false
    },
    phoneno:{
        type:DataTypes.STRING,
        allowNull:false
       
    },
    cntprsn:{
        type:DataTypes.STRING,
        allowNull:false
    },
    cntprsnmob:{
        type:DataTypes.STRING,
        allowNull:false
        
    },
    isactive:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    }, 

},{
    timestamps: false,
  
  });



module.exports=Hospital;