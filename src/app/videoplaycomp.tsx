import React, { useRef } from 'react';
import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
export const VideoComponent = ({ path, hoverplay }) => {
 const videoRef = useRef();

 const handleMouseEnter = () => {
    const video = videoRef.current;
    hoverplay?video.play():null;
 };

 const handleMouseLeave = () => {
    const video = videoRef.current;
    hoverplay?video.pause():null;

 };

 return (
    <video
      ref={videoRef}
      controls={true}
      muted
      controlsList="nodownload"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      src={`${convertFileSrc(path)}`}
    ></video>
 );
};