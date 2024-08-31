import React, { useState } from 'react';
import axios from 'axios';

const ReceiverPage = () => {
  const [receivingID, setReceivingID] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');

  const handleRequestFile = async () => {
    if (!receivingID) return;
  
    try {
      const response = await axios.get(`http://localhost:5000/file/${receivingID}`, {
        responseType: 'json',
      });
      
      if (response.status === 200) {
        // Extract the filename and filetype from the response
        const { filename, filetype } = response.data;
        
        // Set the file URL including the filename with extension
        setFileUrl(`http://localhost:5000/file/${receivingID}`);
        console.log(fileUrl);
        
        setFileType(filetype);
      }
    } catch (err) {
      console.error('Error requesting file:', err);
    }
  };
  

  return (
    <div style={{ padding: '20px' }}>
      <h1>File Receiver</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter sending ID"
          value={receivingID}
          onChange={(e) => setReceivingID(e.target.value)}
        />
        <button onClick={handleRequestFile} disabled={!receivingID}>
          Request File
        </button>
      </div>

      {fileUrl && (
        <div>
          <h2>Received File</h2>
          <a href={fileUrl} download>
            Download File
          </a>
          {fileType && (
            <div>
              <p>File type: {fileType}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiverPage;
