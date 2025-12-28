require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Internal imports
const sequelize = require("./src/db/dbConnection");
const verifyToken = require("./src/middlewares/authMiddileware");
const role = require("./src/middlewares/roleMiddleware");
const PatientRoutes = require("./src/routes/patientRoutes");
const ReportRoutes = require("./src/routes/reportRoutes");
const UploadTRF = require("./src/controller/patientControllers/trf");
const UploadImage = require("./src/controller/patientControllers/profileImage");

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || "development";

// 1. GLOBAL RATE LIMITING
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 100, // Limit each IP to 100 requests per window
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: "Too many requests from this IP, please try again later."
// });

// 2. SECURITY & PERFORMANCE MIDDLEWARE
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression()); // Compress response bodies
// app.use(limiter);

// Robust CORS Configuration
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin) || NODE_ENV === "development") {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));

app.use(cors()); // Temporary open CORS for all origins

// Body Parsing with safety limits
app.use(express.json({ limit: "400kb" }));
app.use(express.urlencoded({ extended: true, limit: "400kb" }));

// Logging
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// 3. HEALTH & BASE ROUTES
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "UP", database: "connected", timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: "DOWN", database: "disconnected" });
  }
});

// 4. ROUTE DEFINITIONS
const API_PREFIX_V1 = "/api/v1/recep";
const API_PREFIX_V2 = "/api/v2/recep";
const API_PREFIX_V3 = "/api/v3/recep";

app.use(`${API_PREFIX_V1}/report`, verifyToken, role("reception"), ReportRoutes);
app.use(API_PREFIX_V1, verifyToken, role("reception"), PatientRoutes);

app.use(API_PREFIX_V2, verifyToken, role("admin"), PatientRoutes);

// app.use(`${API_PREFIX_V3}/report`, verifyToken, role("reception"), ReportRoutes);
// app.use(API_PREFIX_V3, verifyToken, role("reception"), PatientRoutes);

app.use("/api/v4/search", verifyToken, role("admin", "reception", "phlebotomist"), PatientRoutes);

// File Uploads
app.use("/trf/upload", UploadTRF);
app.use("/profile/upload", UploadImage);

// 5. 404 & GLOBAL ERROR HANDLER
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.stack}`);
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { stack: err.stack })
  });
});

// 6. SERVER INITIALIZATION & GRACEFUL SHUTDOWN
const startServer = async () => {
  try {
    await sequelize.authenticate();
    //  await sequelize.sync({ alter: true });
    console.log("✅ Database connection established.");

    // Avoid .sync() in production; use migrations instead
    if (NODE_ENV === "development") {
      await sequelize.sync();
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log("Shutting down gracefully...");
      server.close(() => {
        sequelize.close();
        console.log("Process terminated.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();