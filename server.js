require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || "development";

// import dependencies
const sequelize = require("./db/dbConnection");
const verifyToken = require("./middlewares/authMiddileware");
const role = require("./middlewares/roleMiddleware");
const PatientRoutes = require("./routes/route");
const UploadTRF = require("./controller/trf");
const UploadImage = require("./controller/profileImage");

//Basic security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Configuration - Allow hospital internal networks
app.use(
  cors({
    origin:
      NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",")
        : true,
    credentials: true,
  })
);
// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
if (NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});


// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Phlebotomist Microservice",
    version: process.env.APP_VERSION || "1.0.0",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// All Routes Define here
// Routes For Patient Management
// Only Phlebotomist can access these routes
app.use("/api/v1/phleb", verifyToken, role("phlebotomist"), PatientRoutes);
// Only Admin can access these routes
app.use('/api/v2/phleb',verifyToken,role("admin"),PatientRoutes);
// Common Image Uploder
app.use("/trf/upload", UploadTRF);
app.use("/profile/upload", UploadImage);



const server = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    if (NODE_ENV === "development") {
      await sequelize.sync();
    }

    // await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
};

server();
