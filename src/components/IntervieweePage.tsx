import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CandidateForm from './CandidateForm';
import InterviewChat from './InterviewChat';
import WelcomeBackModal from './WelcomeBackModal';
import PreInterviewCheck from './PreInterviewCheck';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setInterviewStep, 
  setCurrentCandidate, 
  addCandidate, 
  updateCandidate, 
  setCurrentMode, 
  finishInterview,
  Candidate 
} from '@/store/interviewSlice';
import { toast } from "sonner";

type NewCandidateData = {
  name: string;
  email: string;
  phone: string;
  resumeDataUrl: string;
};

const IntervieweePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const interviewStep = useAppSelector((state) => state.interview.interviewStep);
  const currentCandidate = useAppSelector((state) => state.interview.currentCandidate);
  const candidates = useAppSelector((state) => state.interview.candidates);
  
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState<NewCandidateData | null>(null);
  const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);

  const terminateInterview = useCallback(() => {
    if (!currentCandidate) return;

    const finalCandidate = {
      ...currentCandidate,
      status: 'completed' as const,
      endTime: new Date(),
      aiSummary: 'Interview terminated due to leaving the test environment.',
      score: 0,
    };

    dispatch(finishInterview(finalCandidate));
    setIsDisqualified(true);
  }, [currentCandidate, dispatch]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn('Fullscreen not supported or denied:', err);
      // No toast on denial for smoother UX, rely on other violation checks
    }
  };

  useEffect(() => {
    // Enhanced window violation detection for interview security
    if (interviewStep !== 'interview' || !currentCandidate || isDisqualified) {
      return;
    }

    let isProcessingViolation = false;

    const processViolation = () => {
      if (isProcessingViolation) return;
      isProcessingViolation = true;
      
      setViolationCount(count => {
        const newCount = count + 1;
        if (newCount === 1) {
          toast.warning("⚠️ Security Warning", {
            description: "Leaving the interview environment is not allowed. Next violation will terminate the interview.",
            duration: 6000,
          });
        } else if (newCount >= 2) {
          // Immediate termination on second violation
          setTimeout(() => terminateInterview(), 1000);
        }
        return newCount;
      });
      
      setTimeout(() => {
        isProcessingViolation = false;
      }, 1000);
    };

    // Visibility change detection (switching tabs/windows)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Interview violation: Tab/window hidden');
        processViolation();
      }
    };

    // Focus change detection (clicking outside)
    const handleWindowBlur = () => {
      console.log('Interview violation: Window lost focus');
      processViolation();
    };

    // Fullscreen exit detection
    const handleFullscreenChange = () => {
      // Check if not in fullscreen AND we are actively in the interview step
      if (!document.fullscreenElement) {
        console.log('Interview violation: Fullscreen exited');
        processViolation();
      }
    };

    // Key combination prevention (Dev tools)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools (Chrome/Edge)
        e.key === 'F12' || // Dev tools
        (e.key === 'F11') // Fullscreen Toggle Prevention
      ) {
        e.preventDefault();
        processViolation();
        return false;
      }
    };
    
    // Right-click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Initialize security measures
    // Only attempt fullscreen if we are in the 'interview' step
    if (interviewStep === 'interview') {
      enterFullscreen();
    }

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange); // Added fullscreen listener
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Removed document.exitFullscreen() on unmount for cleaner UX
    };
  }, [interviewStep, currentCandidate, isDisqualified, terminateInterview]);

  const startNewInterviewFlow = (data: NewCandidateData) => {
    const newCandidate: Candidate = {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeDataUrl: data.resumeDataUrl,
      score: 0,
      status: 'in-progress',
      startTime: new Date(),
      answers: [],
      currentQuestionIndex: 0,
      questions: [],
    };

    // Mark old interview as completed if starting a fresh one
    if (existingCandidate) {
      dispatch(updateCandidate({ id: existingCandidate.id, updates: { status: 'completed', endTime: new Date() } }));
    }

    dispatch(addCandidate(newCandidate));
    dispatch(setCurrentCandidate(newCandidate));
    dispatch(setInterviewStep('pre-interview-check'));
  };

  const handleFormComplete = (data: NewCandidateData) => {
    const inProgressInterview = candidates.find(
      c => c.email.toLowerCase() === data.email.toLowerCase() && c.status === 'in-progress'
    );

    if (inProgressInterview) {
      setExistingCandidate(inProgressInterview);
      setNewCandidateData(data);
      setShowWelcomeBackModal(true);
    } else {
      // Start the flow with the extracted/manual data
      startNewInterviewFlow(data);
    }
  };

  const handleResumeOldInterview = () => {
    if (existingCandidate) {
      dispatch(setCurrentCandidate(existingCandidate));
      dispatch(setInterviewStep('interview'));
      setShowWelcomeBackModal(false);
    }
  };

  const handleStartNewInterview = () => {
    if (newCandidateData) {
      // This will call startNewInterviewFlow, which correctly transitions to 'pre-interview-check'
      startNewInterviewFlow(newCandidateData); 
      setShowWelcomeBackModal(false);
    }
  };

  const handleBackToLanding = () => {
    dispatch(setCurrentMode('landing'));
  };

  if (isDisqualified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md p-8 bg-card rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-bold text-destructive mb-4">Interview Terminated</h2>
          <p className="text-muted-foreground mb-6">
            This interview session has been terminated because you left the test environment multiple times.
          </p>
          <Button onClick={handleBackToLanding}>
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {interviewStep === 'form' && (
        <div className="relative">
          <Button
            variant="ghost"
            onClick={handleBackToLanding}
            className="absolute top-6 left-6 z-10 flex items-center gap-2 backdrop-blur-sm bg-card/50 hover:bg-card/80 border border-border/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <CandidateForm onComplete={handleFormComplete} />
        </div>
      )}

      {/* Renders the conversational flow for checking missing fields */}
      {interviewStep === 'pre-interview-check' && <PreInterviewCheck />}

      {/* Renders the main chat interview interface */}
      {interviewStep === 'interview' && <InterviewChat />}

      {showWelcomeBackModal && (
        <WelcomeBackModal
          onConfirm={handleResumeOldInterview}
          onDecline={handleStartNewInterview}
          onClose={() => setShowWelcomeBackModal(false)}
        />
      )}
    </div>
  );
}

export default IntervieweePage;