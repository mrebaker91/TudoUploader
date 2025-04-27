const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Your secret token (replace 'your_secret_here' with your Render env var)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your_secret_here';

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer setup to accept original filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

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

// Secure list uploads endpoint (list ALL files)
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
    res.json(files);
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

// Secure delete endpoint for unwanted files
app.delete('/uploads/:filename', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    console.warn('🚫 Unauthorized attempt to delete uploads!');
    return res.status(403).send('Forbidden');
  }

  const filepath = path.join('uploads', req.params.filename);
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('❌ Error deleting file:', err);
      return res.status(500).send('Server error deleting file.');
    }
    console.log(`✅ Deleted file: ${req.params.filename}`);
    res.status(200).send('✅ File deleted');
  });
});

// Serve static frontend from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
