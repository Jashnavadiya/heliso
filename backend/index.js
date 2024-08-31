const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS
app.use(cors({
  origin: 'http://192.168.1.45:3030', // Your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Generate a unique 4-digit code
const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// In-memory storage for code-to-filename mapping
const codeToFilename = {};

// Set up file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    
    // Generate a unique 4-digit code
    const sendingID = generateCode();
    
    // Store the code-to-filename mapping
    codeToFilename[sendingID] = req.file.filename;
    
    io.emit(`fileUploaded:${sendingID}`, { filename: req.file.filename, filetype: req.file.mimetype });
    
    res.status(200).send({ message: 'File uploaded successfully', sendingID, filename: req.file.filename, filetype: req.file.mimetype });
  } catch (err) {
    console.error('Error handling file upload:', err);
    res.status(500).send('Server error');
  }
});

// Handle file request
app.get('/file/:code', (req, res) => {
  const filename = codeToFilename[req.params.code];
  
  if (!filename) {
    return res.status(404).send('File not found');
  }
  
  const filePath = path.join(uploadsDir, filename);
  const mimeType = mime.lookup(filename);

  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    }
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('requestFile', (sendingID) => {
    socket.broadcast.emit(`requestFile:${sendingID}`, { senderId: socket.id });
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start the server
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
