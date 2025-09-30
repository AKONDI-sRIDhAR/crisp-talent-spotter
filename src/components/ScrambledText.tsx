import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ScrambledTextProps {
  children: string;
  className?: string;
  radius?: number;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  children,
  className = '',
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
}) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const text = children;
    const chars = scrambleChars.split('');
    const element = textRef.current;
    element.textContent = text;

    // Split text into individual characters
    const letters = text.split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.display = 'inline-block';
      return span;
    });

    element.textContent = '';
    letters.forEach((letter) => element.appendChild(letter));

    // Animate each letter
    letters.forEach((letter, index) => {
      const delay = (index * speed) / text.length;
      
      gsap.fromTo(
        letter,
        {
          opacity: 0,
          scale: 0.5,
        },
        {
          opacity: 1,
          scale: 1,
          duration: duration,
          delay: delay,
          ease: 'power2.out',
          onUpdate: function () {
            if (this.progress() < 0.7) {
              letter.textContent = chars[Math.floor(Math.random() * chars.length)];
            } else {
              letter.textContent = text[index];
            }
          },
        }
      );
    });

    return () => {
      gsap.killTweensOf(letters);
    };
  }, [children, duration, speed, scrambleChars]);

  return <div ref={textRef} className={className}></div>;
};

export default ScrambledText;
