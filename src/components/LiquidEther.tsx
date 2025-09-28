import React, { useRef, useEffect } from 'react';

interface LiquidEtherProps {
  colors: string[];
  mouseForce: number;
  cursorSize: number;
  isViscous: boolean;
  viscous: number;
  iterationsViscous: number;
  iterationsPoisson: number;
  resolution: number;
  isBounce: boolean;
  autoDemo: boolean;
  autoSpeed: number;
  autoIntensity: number;
  takeoverDuration: number;
  autoResumeDelay: number;
  autoRampDuration: number;
}

const LiquidEther: React.FC<LiquidEtherProps> = ({
  colors,
  mouseForce,
  cursorSize,
  isViscous,
  viscous,
  iterationsViscous,
  iterationsPoisson,
  resolution,
  isBounce,
  autoDemo,
  autoSpeed,
  autoIntensity,
  takeoverDuration,
  autoResumeDelay,
  autoRampDuration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * resolution;
      canvas.height = rect.height * resolution;
      ctx.scale(resolution, resolution);
    };

    resizeCanvas();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 150; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width / resolution,
          y: Math.random() * canvas.height / resolution,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: Math.random()
        });
      }
    };

    initParticles();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / resolution, canvas.height / resolution);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width / resolution, canvas.height / resolution);
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
      });
      
      // Animate particles
      particlesRef.current.forEach((particle, index) => {
        // Auto demo movement
        if (autoDemo) {
          const time = Date.now() * 0.001 * autoSpeed;
          particle.x += Math.sin(time + index * 0.1) * autoIntensity;
          particle.y += Math.cos(time + index * 0.1) * autoIntensity;
        }

        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cursorSize) {
          const force = (cursorSize - distance) / cursorSize * mouseForce;
          particle.vx += (dx / distance) * force * 0.01;
          particle.vy += (dy / distance) * force * 0.01;
        }

        // Apply viscosity
        if (isViscous) {
          particle.vx *= (100 - viscous) / 100;
          particle.vy *= (100 - viscous) / 100;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary conditions
        if (isBounce) {
          if (particle.x < 0 || particle.x > canvas.width / resolution) particle.vx *= -0.8;
          if (particle.y < 0 || particle.y > canvas.height / resolution) particle.vy *= -0.8;
        }

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width / resolution, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height / resolution, particle.y));

        // Update life for color animation
        particle.life += 0.01;
        if (particle.life > 1) particle.life = 0;
      });

      // Draw fluid effect
      ctx.globalCompositeOperation = 'lighter';
      particlesRef.current.forEach((particle, index) => {
        const colorIndex = Math.floor(particle.life * colors.length);
        const color = colors[colorIndex] || colors[0];
        
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, 50
        );
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 50, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(animate);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colors, mouseForce, cursorSize, isViscous, viscous, autoDemo, autoSpeed, autoIntensity, resolution, isBounce]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};

export default LiquidEther;
