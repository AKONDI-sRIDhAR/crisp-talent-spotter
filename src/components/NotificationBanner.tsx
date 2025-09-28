import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Settings, X } from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import { Button } from './ui/button';

const NotificationBanner: React.FC = () => {
  const { apiKey } = useInterviewStore();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Only show the banner if there is no API key and it hasn't been dismissed
  if (apiKey || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="bg-primary/10 border-b border-primary/20 text-primary-foreground p-3 text-center text-sm"
      >
        <div className="container mx-auto flex items-center justify-center gap-4">
          <Info className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="flex-grow">
            <strong>Fallback Mode:</strong> You are using static questions. For a fully dynamic AI experience, please set your API key in the settings.
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 text-primary hover:bg-primary/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationBanner;