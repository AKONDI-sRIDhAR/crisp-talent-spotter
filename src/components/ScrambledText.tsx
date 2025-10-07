import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface ScrambledTextProps {
  children: string;
  className?: string;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
  radius?: number; // Not used internally but accepted for API compatibility
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  children,
  className = '',
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:@#$%',
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  
  // Helper to get a random scramble character
  const randomChar = useCallback((chars: string) => chars[Math.floor(Math.random() * chars.length)], []);

  // --- Core Scramble/Unscramble Logic ---
  const scrambleText = useCallback((onComplete?: () => void) => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Create a new timeline instance
    const tl = gsap.timeline({ onComplete });
    timelineRef.current = tl;

    lettersRef.current.forEach((letter, index) => {
      const delay = (index * speed) / children.length;
      const finalChar = children[index];
      const initialChar = letter.textContent;

      // 1. Scramble/Animate-In Phase
      tl.to(letter, {
          duration: duration,
          delay: delay,
          ease: 'power2.out',
          // CRITICAL FIX: Only update text content, keep original visual state intact.
          // The parent CSS handles the coloring (text-transparent + bg-clip-text)
          onUpdate: function () {
            const progress = this.progress();
            if (progress < 0.9) {
              letter.textContent = randomChar(scrambleChars);
            } else if (letter.textContent !== finalChar) {
              letter.textContent = finalChar;
            }
          },
          onComplete: () => {
             // Ensure it ends on the correct letter
             letter.textContent = finalChar;
          }
      }, 0); // Start at time 0 of the timeline
    });

  }, [children, duration, speed, scrambleChars, randomChar]);


  // --- Hover Scramble Logic ---
  const scrambleOnHover = useCallback(() => {
    if (timelineRef.current && timelineRef.current.isActive()) {
        return; // Don't interrupt the initial animation
    }
    
    // Create a new, temporary timeline for the hover effect
    const hoverTl = gsap.timeline();

    lettersRef.current.forEach((letter, index) => {
      const scrambleDelay = index * 0.03; // Quick scramble delay
      const initialChar = children[index];
      
      // Scramble: Quick scramble and hold
      hoverTl.to(letter, {
          duration: 0.2, // Fast scramble
          delay: scrambleDelay,
          // Use GSAP's textContent plugin helper to randomize (requires string array)
          textContent: scrambleChars.split(''), 
          ease: 'none',
          onComplete: () => {
             // Keep scrambled until mouse leaves
             letter.textContent = randomChar(scrambleChars); 
          }
      }, 0); 

      // On mouse leave, we reverse the effect in handleMouseLeave
    });
    
    // Store the hover timeline reference so we can reverse it
    timelineRef.current = hoverTl;

  }, [children, scrambleChars, randomChar]);

  const restoreOnLeave = useCallback(() => {
    // Reverse the current timeline to restore the original text
    if (timelineRef.current && timelineRef.current.isActive()) {
        // Kill existing scramble if running (important for overlapping effects)
        timelineRef.current.kill();
    }
    
    // Create a new timeline for smooth unscramble
    const restoreTl = gsap.timeline();
    timelineRef.current = restoreTl;

    lettersRef.current.forEach((letter, index) => {
      const delay = (children.length - 1 - index) * 0.02; // Reverse direction stagger
      const finalChar = children[index];
      
      restoreTl.to(letter, {
          duration: 0.3, 
          delay: delay,
          ease: 'power1.out',
          textContent: finalChar, // Animate back to the final character
          onUpdate: function () {
             // Keep scrambling until near the end of the restore animation
             if (this.progress() < 0.8) {
                letter.textContent = randomChar(scrambleChars);
             }
          },
          onComplete: () => {
             letter.textContent = finalChar;
          }
      }, 0);
    });

  }, [children, scrambleChars, randomChar]);


  // --- Initial Setup and Event Listeners ---
  useEffect(() => {
    if (!textRef.current || !children) return;

    const element = textRef.current;
    element.textContent = ''; // Clear content for hydration

    const newLetters: HTMLSpanElement[] = children.split('').map((char) => {
      const span = document.createElement('span');
      // CRITICAL: Set initial appearance CSS
      span.style.opacity = '1'; 
      span.style.display = 'inline-block';
      span.textContent = randomChar(scrambleChars); // Start with scrambled visible text
      span.style.transition = 'none'; // Prevent CSS transitions from interfering
      element.appendChild(span);
      return span;
    });
    lettersRef.current = newLetters;

    // Start the initial animation immediately
    scrambleText();

    // Attach hover listeners for the requested effect
    element.addEventListener('mouseenter', scrambleOnHover);
    element.addEventListener('mouseleave', restoreOnLeave);
    
    return () => {
      // Cleanup
      gsap.killTweensOf(newLetters);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      
      element.removeEventListener('mouseenter', scrambleOnHover);
      element.removeEventListener('mouseleave', restoreOnLeave);
      
      // Final clear on component unmount
      element.textContent = '';
    };

  }, [children, scrambleText, scrambleOnHover, restoreOnLeave, randomChar, scrambleChars]);

  // The content is built by JS inside the useEffect, so we return an empty container.
  return <div ref={textRef} className={className}></div>;
};

export default ScrambledText;