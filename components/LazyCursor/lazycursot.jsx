"use client";
import React, { useState, useEffect, useRef } from "react";
import "./Cursor.css";

const CircularCursor = () => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);


  useEffect(() => {
    const updatePosition = (event) => {
      const { clientX, clientY, pageX, pageY } = event;

      cursorRef.current.style.transform = `translate(${
        pageX - cursorRef.current.clientWidth / 2
      }px, ${pageY - cursorRef.current.clientHeight / 2}px)`;
      followerRef.current.style.transform = `translate(${
        pageX - followerRef.current.clientWidth / 2
      }px, ${pageY - followerRef.current.clientHeight / 2}px)`;
    };

    const handleElementHover = (e) => {
      const target = e.target;
      const isInteractive = target.matches('a, button, input, textarea, select, [role="button"], [tabindex]');
      setIsHovering(isInteractive);
    };
    
    document.addEventListener('mouseover', handleElementHover);
    window.addEventListener("mousemove", updatePosition);
    return() => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener('mouseover', handleElementHover);
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={cursorRef}></div>
      <div className="cursor-follower" ref={followerRef}></div>
    </>
  );
};

export default CircularCursor;