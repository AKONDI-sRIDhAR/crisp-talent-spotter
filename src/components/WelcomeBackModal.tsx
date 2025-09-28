import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';

const WelcomeBackModal: React.FC = () => {
  const { 
    showWelcomeBack, 
    setShowWelcomeBack, 
    currentCandidate, 
    setCurrentMode,
    setCurrentCandidate 
  } = useInterviewStore();

  const handleResumeInterview = () => {
    setShowWelcomeBack(false);
    setCurrentMode('interviewee');
  };

  const handleStartFresh = () => {
    setCurrentCandidate(null);
    setShowWelcomeBack(false);
    setCurrentMode('landing');
  };

  if (!currentCandidate) return null;

  const progress = `${currentCandidate.answers.length}/6 questions`;
  const timeElapsed = currentCandidate.startTime 
    ? Math.floor((Date.now() - new Date(currentCandidate.startTime).getTime()) / 1000 / 60)
    : 0;

  return (
    <Dialog open={showWelcomeBack} onOpenChange={setShowWelcomeBack}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome Back!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold">{currentCandidate.name}</h3>
            <p className="text-muted-foreground">
              You have an unfinished interview session
            </p>
          </motion.div>

          <motion.div 
            className="bg-muted/30 rounded-lg p-4 space-y-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{progress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time elapsed:</span>
              <span className="font-medium">{timeElapsed} minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize text-accent">
                {currentCandidate.status}
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              onClick={handleResumeInterview} 
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resume Interview
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleStartFresh}
              className="w-full"
              size="lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Start Fresh
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;