import React, { useRef } from 'react';
import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'

interface VideoComponentProps {
  path: string;
  hoverplay: boolean;
  className?: string;
}

export const VideoComponent = ({ path, hoverplay, className = "" }: VideoComponentProps) => {
 const videoRef = useRef<HTMLVideoElement>(null);

 const handleMouseEnter = () => {
   const video = videoRef.current;
   if (hoverplay && video) {
     video.play();
   }
 };

 const handleMouseLeave = () => {
   const video = videoRef.current;
   if (hoverplay && video) {
     video.pause();
   }
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
     className={className}
   ></video>
 );
};