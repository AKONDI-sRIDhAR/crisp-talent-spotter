import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import InterviewChat from './InterviewChat';
import WelcomeBackModal from './WelcomeBackModal';
import { useInterviewStore, Candidate } from '@/store/interviewStore';
// NOTE: import { questionSets } from '@/lib/preGeneratedQuestions'; is removed, as questions are generated dynamically.

type NewCandidateData = {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  resumeDataUrl: string; // The correct, merged type definition
};

import { toast } from "sonner";

const IntervieweePage: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'interview'>('upload');
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

  const terminateInterview = () => {
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
  };

  useEffect(() => {
    if (violationCount === 1) {
      toast.warning("Warning: Leaving the test environment is not allowed.", {
        description: "Your next violation will automatically terminate the interview.",
        duration: 8000,
      });
    } else if (violationCount >= 2) {
      terminateInterview();
    }
  }, [violationCount]);

  useEffect(() => {
    // If there's a candidate in the store, we are in an active interview
    if (currentCandidate && currentCandidate.status !== 'completed') {
      setStep('interview');
    }
  }, [currentCandidate]);

  useEffect(() => {
    if (step !== 'interview' || !currentCandidate || isDisqualified) {
      return;
    }

    const violationProcessingRef = React.useRef(false);

    const processViolation = () => {
      if (violationProcessingRef.current) return;
      violationProcessingRef.current = true;
      setViolationCount(count => count + 1);
      setTimeout(() => {
        violationProcessingRef.current = false;
      }, 500);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        processViolation();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        processViolation();
      }
    };

    document.documentElement.requestFullscreen().catch(err => {
      console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [step, currentCandidate, isDisqualified]);

  const startNewInterview = (data: NewCandidateData) => {
    // Create a new candidate
    const newCandidate: Candidate = {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeText: data.resumeText,
      resumeDataUrl: data.resumeDataUrl, // Correctly assigns the data URL
      score: 0,
      status: 'in-progress',
      startTime: new Date(),
      answers: [],
      currentQuestionIndex: 0,
      questions: [], // RESOLUTION: Initializing questions array as empty for dynamic generation
    };

    // If there was an old in-progress interview, mark it as completed
    if (existingCandidate) {
      updateCandidate(existingCandidate.id, { status: 'completed', endTime: new Date() });
    }

    addCandidate(newCandidate);
    setCurrentCandidate(newCandidate);
    setStep('interview');
  };

  const handleResumeComplete = (data: NewCandidateData) => {
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
      {step === 'upload' && (
        <div className="p-6">
          {/* Header */}
          <div className="max-w-2xl mx-auto mb-6">
            <Button
              variant="outline"
              onClick={handleBackToLanding}
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ResumeUpload onComplete={handleResumeComplete} />
          </motion.div>
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