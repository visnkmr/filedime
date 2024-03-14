import React, { Dispatch, SetStateAction, useState } from 'react';
import axios from 'axios';
interface fuargs{
    fge:string;
    setcmsg:Dispatch<SetStateAction<string>>
}
const FileUploadComponent = ({fge,setcmsg}:fuargs) => {
 const [files, setFiles] = useState([]);
 const [collectionName, setCollectionName] = useState('');

 const handleFileChange = (e) => {
    setFiles([...e.target.files]);
 };

//  const handleCollectionNameChange = (e) => {
//     setCollectionName(e.target.value);
//  };

 const handleSubmit = async (e) => {
  console.log(fge)
    e.preventDefault();

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    // if (collectionName) {
    //   formData.append('collection_name', collectionName);
    // }

    try {
      const response = await axios.post(`${fge}/embedfromremote`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data['message']);
      setcmsg(response.data['message'])
      // Handle the response as needed
    } catch (error) {
      console.error('Error uploading files:', error);
      setcmsg('Error uploading files:'+ error)
      
      // Handle the error as needed
    }
 };

 return (
    <div className='p-2'>
      <h1 className='font-bold p-2 '>FileGPT should answer based on :</h1>
      <input type="file" multiple onChange={handleFileChange} />
      {/* <input type="text" placeholder="Collection Name" onChange={handleCollectionNameChange} /> */}
      <button onClick={handleSubmit}>Upload</button>
    </div>
 );
};

export default FileUploadComponent;