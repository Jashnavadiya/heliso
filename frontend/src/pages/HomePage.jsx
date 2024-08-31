import React, { useState } from 'react';
import axios from 'axios';

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [sendingID, setSendingID] = useState('');
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://heliso.onrender.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Display the 4-digit code and filename
      setSendingID(response.data.sendingID);
      
      // Reset file input
      setFile(null); 
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>File Sharing App</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          onChange={handleFileChange}
        />
        <button onClick={handleUpload} disabled={!file}>
          Upload File
        </button>
      </div>

      {sendingID && (
        <div>
          <h2>File uploaded successfully!</h2>
          <p>Your sending ID: <strong>{sendingID}</strong></p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
