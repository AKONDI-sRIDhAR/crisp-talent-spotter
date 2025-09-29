import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CandidateForm from './CandidateForm';
import InterviewChat from './InterviewChat';
import WelcomeBackModal from './WelcomeBackModal';
import { useInterviewStore, Candidate } from '@/store/interviewStore';
// NOTE: import { questionSets } from '@/lib/preGeneratedQuestions'; is removed, as questions are generated dynamically.

type NewCandidateData = {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  resumeDataUrl: string;
  resumeSummary: string | null;
};

import { toast } from "sonner";

const IntervieweePage: React.FC = () => {
  const [step, setStep] = useState<'form' | 'interview'>('form');
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState<NewCandidateData | null>(null);
  const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);

  const { 
    currentCandidate,
    setCurrentCandidate,
    candidates,
    addCandidate,
    updateCandidate,
    setCurrentMode,
    finishInterview,
    questionSetIndex, // Kept for minimal change, though unused
    incrementQuestionSetIndex, // Kept for minimal change, though unused
  } = useInterviewStore();

  const terminateInterview = useCallback(() => {
    if (!currentCandidate) return;

    const finalCandidate = {
      ...currentCandidate,
      status: 'completed' as const,
      endTime: new Date(),
      aiSummary: 'Interview terminated due to leaving the test environment.',
      score: 0,
    };

    finishInterview(finalCandidate);
    setIsDisqualified(true);
  }, [currentCandidate, finishInterview]);

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
      if (!document.fullscreenElement) {
        console.log('Interview violation: Fullscreen exited');
        processViolation();
      }
    };

    // Simplified Key combination prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
        e.key === 'F12' // Dev tools
      ) {
        e.preventDefault();
        processViolation();
        return false;
      }
    };

    // Request fullscreen mode
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen not supported or denied:', err);
        toast.warning("Fullscreen Recommended", {
          description: "For the best interview experience, please enable fullscreen mode.",
          duration: 5000,
        });
      }
    };

    // Initialize security measures
    enterFullscreen();

    // Add simplified event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [interviewStep, currentCandidate, isDisqualified, terminateInterview]);

  const startNewInterview = (data: NewCandidateData) => {
    // Create a new candidate
    const newCandidate: Candidate = {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeText: data.resumeText,
      resumeDataUrl: data.resumeDataUrl,
      score: 0,
      status: 'in-progress',
      startTime: new Date(),
      answers: [],
      currentQuestionIndex: 0,
      questions: [], // Dynamic AI-generated questions
    };

    // If there was an old in-progress interview, mark it as completed
    if (existingCandidate) {
      updateCandidate(existingCandidate.id, { status: 'completed', endTime: new Date() });
    }

    addCandidate(newCandidate);
    setCurrentCandidate(newCandidate);
    setStep('interview');
  };

  const handleFormComplete = (data: NewCandidateData) => {
    // Check if a candidate with this email has an interview in progress
    const inProgressInterview = candidates.find(
      c => c.email.toLowerCase() === data.email.toLowerCase() && c.status === 'in-progress'
    );

    if (inProgressInterview) {
      setExistingCandidate(inProgressInterview);
      setNewCandidateData(data);
      setShowWelcomeBackModal(true);
    } else {
      startNewInterview(data);
    }
  };

  const handleResumeOldInterview = () => {
    if (existingCandidate) {
      setCurrentCandidate(existingCandidate);
      setStep('interview');
      setShowWelcomeBackModal(false);
    }
  };

  const handleStartNewInterview = () => {
    if (newCandidateData) {
      startNewInterview(newCandidateData);
      setShowWelcomeBackModal(false);
    }
  };

  const handleBackToLanding = () => {
    setCurrentMode('landing');
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
      {step === 'form' && (
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

      {step === 'interview' && <InterviewChat />}

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