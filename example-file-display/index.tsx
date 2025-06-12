import React from "react";

interface FileNameDisplayProps {
  filename: string;
}

const FileNameDisplay: React.FC<FileNameDisplayProps> = ({ filename }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      fontSize: '1.5em',
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center'
    }}>
      {filename || "No file selected"}
    </div>
  );
};

export default FileNameDisplay;
