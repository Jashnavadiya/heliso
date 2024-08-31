const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const mime = require('mime-types'); // For MIME type detection
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Replace with your frontend URL
    methods: ['GET', 'POST'],
  },
});

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, '../frontend/dist/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enable CORS for express
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.static(path.join(__dirname, "../frontend/dist")));

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
    const uniqueId = uuidv4(); // Generate a unique ID
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

// API route to get file metadata
app.get('/file-metadata/:code', (req, res) => {
  const filename = codeToFilename[req.params.code];
  
  if (!filename) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    const fileStats = fs.statSync(filePath);
    const fileType = mime.lookup(filePath) || 'application/octet-stream';
    res.json({
      filename: path.basename(filePath),
      filetype: fileType,
      size: fileStats.size
    });
  } else {
    res.status(404).send('File not found');
  }
});

// API route to get the file
app.get('/file/:code', (req, res) => {
  const filename = codeToFilename[req.params.code];
  
  if (!filename) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    const fileType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', fileType);
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
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
