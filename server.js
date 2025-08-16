require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const sequelize = require("./db/dbConnection");
const PORT = process.env.PORT;
const verifyToken=require('./middlewares/authMiddileware');
const role=require('./middlewares/roleMiddleware');
const PatientRoutes = require("./routes/route");
const UploaTRF = require("./controller/trf");

app.use(cors());
app.use(express.json());




// All Routes Define here
app.use('/phelb',verifyToken,role("phlebotomist"),PatientRoutes);

// Common Image Uploder
app.use('/trf/upload',UploaTRF);


const server = async () => {
  try {
    await sequelize
      .authenticate()
      .then(() => {
        console.log("DB connected successfully");
      })
      .catch((error) => {
        console.error("Unable to connect to the database:", error);
      });
        // await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
};

server();
