import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';

interface WelcomeBackModalProps {
  onConfirm: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ onConfirm, onDecline, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onEscapeKeyDown={onClose}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Welcome Back!</DialogTitle>
          <DialogDescription className="text-center">
            You have an unfinished interview session.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-center text-muted-foreground">
            Would you like to resume where you left off or start fresh?
          </p>
          <div className="space-y-3 pt-2">
            <Button 
              onClick={onConfirm}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resume Interview
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onDecline}
              className="w-full"
              size="lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Start Fresh
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;