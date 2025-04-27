const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Your secret token (replace 'your_secret_here' later with your Render env var)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your_secret_here';

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer setup to accept file uploads
const upload = multer({ dest: 'uploads/' });

// --- ROUTES ---

// Public upload endpoint (no auth needed)
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('✅ File uploaded:', req.file.originalname);
  res.status(200).send('✅ Upload successful!');
});

// Protected file download endpoint
app.use('/uploads', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    console.warn('🚫 Unauthorized attempt to access uploads!');
    return res.status(403).send('Forbidden');
  }

  // If token is valid, serve static files
  express.static('uploads')(req, res, next);
});

// Serve static frontend from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
