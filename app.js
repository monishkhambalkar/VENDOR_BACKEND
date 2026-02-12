require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const sanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");
const globalErrorHandler = require("./src/middlewares/globalErrorHandler");
const config = require("./src/config/config");

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(sanitize());
app.use(xss());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiter
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);

// Import routes
const adminCategoryRoute = require("./src/routes/category");
const adminSubCategoryRoute = require("./src/routes/subCategory");
const adminProductRoute = require("./src/routes/product");
const adminUserRoute = require("./src/routes/user");
const adminUserSetting = require("./src/routes/userSetting");

// Mount routes
app.use("/admin/api/category", adminCategoryRoute);
app.use("/admin/api/subCategory", adminSubCategoryRoute);
app.use("/admin/api/product", adminProductRoute);
app.use("/admin/api/user", adminUserRoute);
app.use("/admin/api/user-setting", adminUserSetting);

// Default Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to admin server" });
});

// File Upload Handling
app.use(fileUpload());
app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No files were uploaded" });
  }

  try {
    const excelFile = req.files.excelFile;
    const XLSX = require("xlsx");
    const workBook = XLSX.read(excelFile.data, { type: "buffer" });
    const sheetName = workBook.SheetNames[0];
    const sheet = workBook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log("📄 Uploaded Excel data:", data);
    res.json({ message: "File uploaded successfully.", data });
  } catch (error) {
    console.error("❌ File processing error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 404 Error Handling
app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = 404;
  next(err);
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
