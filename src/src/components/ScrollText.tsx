'use client';
import { useState, useEffect } from 'react';
interface scrollprops{
  text:string,
  speed:number
}
export default function ScrollText({ text, speed }:scrollprops) {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPosition((pos) => pos + 1);
    }, speed);

    return () => clearInterval(intervalId);
  }, [speed]);

  return (
    <div className="w-full overflow-hidden">
      <span
        className="inline-block whitespace-nowrap"
        style={{ transform: `translateX(-${position}px)` }}
      >
        {text}
      </span>
    </div>
  );
}
