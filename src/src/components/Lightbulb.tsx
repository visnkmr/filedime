import React from 'react';
import '../../styles/bulb.css';

const Bulb = () => {
  return (
    <svg className="bulb" viewBox="0 0 100 100" height={20} width={20}>
      <circle cx="50" cy="50" r="45" fill="#ffff00" />
    </svg>
  );
};

export default Bulb;