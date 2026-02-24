// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is live");
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// Configure S3 client for Wasabi
const s3 = new S3Client({
  region: process.env.REGION,
  endpoint: process.env.ENDPOINT, // e.g., "https://s3.ap-southeast-1.wasabisys.com"
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

// POST endpoint to generate presigned URL
app.post("/generate-upload-url", async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "Missing fileName or fileType" });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // URL valid 60 seconds

    res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error("S3 ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});