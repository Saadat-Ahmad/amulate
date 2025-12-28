// components/EnhancedCustomCursor.jsx
'use client';

import { useEffect, useState, useRef } from 'react';

const EnhancedCustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef(null);
  useEffect(() => {
    const updateCursorPosition = (event) => {
      const { clientX, clientY, pageX, pageY } = event;

      cursorRef.current.style.transform = `translate(${
        pageX - cursorRef.current.clientWidth / 2
      }px, ${pageY - cursorRef.current.clientHeight / 2}px)`;
      followerRef.current.style.transform = `translate(${
        pageX - followerRef.current.clientWidth / 2
      }px, ${pageY - followerRef.current.clientHeight / 2}px)`;
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Handle hover states for interactive elements
    const handleElementHover = (e) => {
      const target = e.target;
      const isInteractive = target.matches('a, button, input, textarea, select, [role="button"], [tabindex]');
      setIsHovering(isInteractive);
    };

    // Add event listeners
    document.addEventListener('mousemove', updateCursorPosition);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleElementHover);

    // Hide default cursor
    document.body.style.cursor = 'none';

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', updateCursorPosition);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleElementHover);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <div
      className={`custom-cursor ${isHovering ? 'hover' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        opacity: isVisible ? 1 : 0,
        transform: `translate(-50%, -50%) ${isHovering ? 'scale(1.2)' : 'scale(1)'}`,
      }}
    />
  );
};

export default EnhancedCustomCursor;