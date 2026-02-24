require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const sanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");
const createHttpError = require("http-errors"); // IMPORTANT

const globalErrorHandler = require("./src/middlewares/globalErrorHandler");

const app = express();


// ================================
// SECURITY MIDDLEWARE
// ================================
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(sanitize());
app.use(xss());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ================================
// CORS
// ================================
const allowedOrigins = [
  "http://localhost:5173",
  // "http://localhost:5174",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));


// ================================
// RATE LIMITER
// ================================
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);


// ================================
// ROUTES IMPORT
// ================================
const adminCategoryRoute = require("./src/routes/category");
const adminSubCategoryRoute = require("./src/routes/subCategory");
const adminProductRoute = require("./src/routes/product");
const adminUserRoute = require("./src/routes/user");
const adminUserSetting = require("./src/routes/userSetting");


// ================================
// ROUTE MOUNTING
// ================================
app.use("/admin/api/category", adminCategoryRoute);
app.use("/admin/api/subCategory", adminSubCategoryRoute);
app.use("/admin/api/product", adminProductRoute);
app.use("/admin/api/user", adminUserRoute);
app.use("/admin/api/user-setting", adminUserSetting);


// ================================
// DEFAULT ROUTE
// ================================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to admin server" });
});


// ================================
// TEST ERROR ROUTE (FOR CHECKING)
// ================================
app.get("/test-error", (req, res) => {
  throw new Error("Test Error Working");
});


// ================================
// FILE UPLOAD
// ================================
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

    res.json({
      message: "File uploaded successfully.",
      data,
    });

  } catch (error) {
    next(error);
  }
});


// ================================
// 404 HANDLER (ALWAYS LAST ROUTE)
// ================================
app.all("*", (req, res, next) => {
  next(createHttpError(404, `Can't find ${req.originalUrl}`));
});


// ================================
// GLOBAL ERROR HANDLER (LAST)
// ================================
app.use(globalErrorHandler);


module.exports = app;
