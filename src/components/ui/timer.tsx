import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ 
  timeRemaining, 
  totalTime, 
  difficulty, 
  onTimeUp, 
  isActive 
}) => {
  const percentage = (timeRemaining / totalTime) * 100;
  
  const getTimerColor = () => {
    switch (difficulty) {
      case 'easy': return 'hsl(var(--timer-easy))';
      case 'medium': return 'hsl(var(--timer-medium))';
      case 'hard': return 'hsl(var(--timer-hard))';
      default: return 'hsl(var(--primary))';
    }
  };

  const getUrgencyLevel = () => {
    if (percentage > 50) return 'normal';
    if (percentage > 25) return 'warning';
    return 'critical';
  };

  useEffect(() => {
    if (timeRemaining <= 0 && isActive) {
      onTimeUp();
    }
  }, [timeRemaining, isActive, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const urgency = getUrgencyLevel();

  return (
    <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={getTimerColor()}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            animate={{
              strokeDashoffset: `${2 * Math.PI * 28 * (1 - percentage / 100)}`,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={cn(
              urgency === 'critical' && 'drop-shadow-[0_0_8px_currentColor]',
              urgency === 'warning' && 'drop-shadow-[0_0_4px_currentColor]'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex flex-col">
        <motion.div 
          className={cn(
            "text-2xl font-mono font-bold",
            urgency === 'critical' && "text-destructive animate-pulse",
            urgency === 'warning' && "text-yellow-500",
            urgency === 'normal' && "text-foreground"
          )}
          animate={urgency === 'critical' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: urgency === 'critical' ? Infinity : 0 }}
        >
          {formatTime(timeRemaining)}
        </motion.div>
        <div className="text-sm text-muted-foreground capitalize">
          {difficulty} Level
        </div>
      </div>
    </div>
  );
};

export default Timer;