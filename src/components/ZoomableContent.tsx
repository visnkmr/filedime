// components/ZoomableContent.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ZoomableContentProps {
  children: React.ReactNode;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  setclass?: boolean
}

export function ZoomableContent({
  children,
  initialZoom = 1.0,
  minZoom = 0.5,
  maxZoom = 2.0,
  zoomStep = 0.1,
  setclass = true
}: ZoomableContentProps) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);

  // Ref for the scrollable content area to attach the wheel listener
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper function to adjust zoom, encapsulated for reuse
  const adjustZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel((prevZoom) => {
      let newZoom = prevZoom;
      if (direction === 'in') {
        newZoom = Math.min(prevZoom + zoomStep, maxZoom);
      } else {
        newZoom = Math.max(prevZoom - zoomStep, minZoom);
      }
      // Optional: Round to prevent floating point inaccuracies for display
      return parseFloat(newZoom.toFixed(2));
    });
  }, [zoomStep, minZoom, maxZoom]); // Dependencies for useCallback

  const handleZoomIn = () => adjustZoom('in');
  const handleZoomOut = () => adjustZoom('out');
  const handleResetZoom = () => setZoomLevel(initialZoom);


  useEffect(() => {
    // --- Keyboard Event Handler (Ctrl + Plus/Minus) ---
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        if (event.key === '+' || event.key === '=' || event.key === 'Add') { // '+' and '=' for most keyboards, 'Add' for numpad
          event.preventDefault(); // Prevent browser's default zoom
          adjustZoom('in');
        } else if (event.key === '-') {
          event.preventDefault(); // Prevent browser's default zoom
          adjustZoom('out');
        }
      }
    };

    // --- Wheel Event Handler (Ctrl + Scroll) ---
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault(); // Prevent browser's default zoom/scroll
        if (event.deltaY < 0) { // Scrolling up
          adjustZoom('in');
        } else if (event.deltaY > 0) { // Scrolling down
          adjustZoom('out');
        }
      }
    };

    // Attach listeners
    // Keydown on window for global control
    window.addEventListener('keydown', handleKeyDown);

    // Wheel on the contentRef div for localized scroll zoom
    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      // Use { passive: false } to allow preventDefault()
      currentContentRef.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Cleanup function: remove listeners when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (currentContentRef) {
        currentContentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, [adjustZoom]); // Dependencies: adjustZoom function itself


  return (<div
        ref={contentRef} 
        className={`${setclass?"flex-grow overflow-auto":""}`}
        // p-4 transition-transform duration-200 ease-out
        style={{
          transform: `scale(${zoomLevel})`,
          // Ensure content doesn't get cut off if zoomed out significantly
          width: `${(1 / zoomLevel) * 100}%`,
          height: `${(1 / zoomLevel) * 100}%`,
          transformOrigin: 'top left', // Important: Ensures scaling happens from the top-left corner
        }}
      >
        {children}
      </div>
  );
}