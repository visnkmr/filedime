'use client';
import debounce from 'lodash.debounce';
import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';

interface LineClampProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  lines?: number;
}

const LineClamp = ({ text, lines = 2, className, ...props }: LineClampProps) => {
  const [clamped, setClamped] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkButtonAvailability = debounce(() => {
      if (containerRef.current) {
        const hasClamping = containerRef.current.clientHeight < containerRef.current.scrollHeight;
        setShowButton(hasClamping);
      }
    }, 100);

    checkButtonAvailability();
    window.addEventListener('resize', checkButtonAvailability);

    return () => {
      window.removeEventListener('resize', checkButtonAvailability);
    };
  }, []);

  const handleClick = () => setClamped(!clamped);

  const toggleClass = () => {
    setClamped(!clamped);
  };

  return (
    <div className='relative'>
      <div className={classnames(clamped ? `line-clamp-${lines}` : "", className)} ref={containerRef} onClick={toggleClass} {...props}>
        {text}
        {showButton && (
          <button onClick={handleClick} className="absolute right-0 bottom-0 text-blue-500 hover:text-blue-700">
            {clamped ? "..." : "<"}
          </button>
        )}
      </div>
    </div>
  );
};

export default LineClamp;
