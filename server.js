require("dotenv").config();
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// Security Middleware (API Key Protection)
// ==========================
app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.API_SECRET) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  next();
});


// ==========================
// Multer Config (Memory Storage)
// ==========================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  // fileFilter: (req, file, cb) => {
  //   const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  //   if (allowedTypes.includes(file.mimetype)) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Only JPG, PNG, WEBP images are allowed"));
  //   }
  // },
 

//   fileFilter: (req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed"));
//   }
// },
// fileFilter: (req, file, cb) => {
//   console.log("Uploaded MIME TYPE:", file.mimetype);

//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed"));
//   }
// },

});


// ==========================
// Wasabi S3 Configuration
// ==========================
const s3 = new AWS.S3({
  endpoint: process.env.WASABI_ENDPOINT,
  accessKeyId: process.env.WASABI_ACCESS_KEY,
  secretAccessKey: process.env.WASABI_SECRET_KEY,
  region: process.env.WASABI_REGION,
  signatureVersion: "v4",
});

// ==========================
// Upload Route
// ==========================
// app.post("/upload", upload.array("images", 10), async (req, res) => {
    
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No files uploaded",
//       });
//     }

//     const uploadPromises = req.files.map((file) => {
//       const params = {
//         Bucket: process.env.WASABI_BUCKET,
//         Key: `uploads/${Date.now()}-${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       return s3.upload(params).promise();
//     });

//     const results = await Promise.all(uploadPromises);

//     const fileUrls = results.map((file) => file.Location);

//     res.status(200).json({
//       success: true,
//       message: "Files uploaded successfully",
//       urls: fileUrls,
//     });

//   } catch (error) {
//     console.error("Upload Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// app.post("/upload", upload.array("images", 10), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No files uploaded",
//       });
//     }

//     const uploadPromises = req.files.map((file) => {
//       const params = {
//         Bucket: process.env.WASABI_BUCKET,
//         Key: `uploads/${Date.now()}-${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       return s3.upload(params).promise();
//     });

//     const results = await Promise.all(uploadPromises);

//     const fileUrls = results.map((file) => file.Location);

//     return res.status(200).json({
//       success: true,
//       message: "Files uploaded successfully",
//       urls: fileUrls,
//     });

//   } catch (error) {
//     console.error("Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
  
// });
// app.post("/upload", upload.any(), async (req, res) => {
//   try {

//        // 🔎 DEBUG LOGS (Temporary)
//     console.log("========== NEW REQUEST ==========");
//     console.log("FILES RECEIVED:", req.files);
//     console.log("BODY RECEIVED:", req.body);
//     console.log("=================================");

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No files uploaded",
//       });
//     }

//     const uploadPromises = req.files.map((file) => {
//       const params = {
//         Bucket: process.env.WASABI_BUCKET,
//         Key: `uploads/${Date.now()}-${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       return s3.upload(params).promise();
//     });

//     const results = await Promise.all(uploadPromises);

//     // Generate signed URLs (works with private bucket)
//     const fileUrls = results.map((file) => {
//       return s3.getSignedUrl("getObject", {
//         Bucket: process.env.WASABI_BUCKET,
//         Key: file.Key,
//         Expires: 60 * 60, // 1 hour
//       });
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Files uploaded successfully",
//       urls: fileUrls,
//     });

//   } catch (error) {
//     console.error("Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

app.post("/upload", upload.any(), async (req, res) => {
  try {

    console.log("========== NEW REQUEST ==========");
    console.log("FILES RECEIVED:", req.files);
    console.log("BODY RECEIVED:", req.body);
    console.log("=================================");

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploadPromises = req.files.map((file) => {
      const key = `uploads/${Date.now()}-${file.originalname}`;

      return s3.upload({
        Bucket: process.env.WASABI_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }).promise();
    });

    const results = await Promise.all(uploadPromises);

    const fileUrls = results.map((file) => file.Location);

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      urls: fileUrls,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================
// Health Check Route
// ==========================
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running successfully 🚀" });
});

// ==========================
// Start Server (Render Compatible)
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

