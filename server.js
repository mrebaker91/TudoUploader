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
  if (!req.file) {
    console.warn('🚫 No file uploaded!');
    return res.status(400).send('No file uploaded.');
  }

  console.log('✅ File uploaded:', req.file.originalname);
  res.status(200).send('✅ Upload successful!');
});

// Secure list uploads endpoint (only lists .webm files)
app.get('/list_uploads', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    console.warn('🚫 Unauthorized attempt to list uploads!');
    return res.status(403).send('Forbidden');
  }

  fs.readdir('uploads', (err, files) => {
    if (err) {
      console.error('Error reading uploads:', err);
      return res.status(500).send('Server error');
    }
    const uploadedFiles = files.filter(file => file.endsWith('.webm'));
    res.json(uploadedFiles);
  });
});

// Protected file download endpoint
app.use('/uploads', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    console.warn('🚫 Unauthorized attempt to access uploads!');
    return res.status(403).send('Forbidden');
  }

  express.static('uploads')(req, res, next);
});

// Serve static frontend from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
