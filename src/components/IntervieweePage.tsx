import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import InterviewChat from './InterviewChat';
import WelcomeBackModal from './WelcomeBackModal';
import { useInterviewStore, Candidate } from '@/store/interviewStore';
// NOTE: questionSets import is no longer strictly necessary if questions are dynamically generated,
// but kept for now as it's part of the original context.
import { questionSets } from '@/lib/preGeneratedQuestions';

type NewCandidateData = {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  resumeDataUrl: string; // Included from previous merge resolution
};

const IntervieweePage: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'interview'>('upload');
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState<NewCandidateData | null>(null);
  const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null);

  const { 
    currentCandidate,
    setCurrentCandidate,
    candidates,
    addCandidate,
    updateCandidate,
    setCurrentMode,
    questionSetIndex,
    incrementQuestionSetIndex,
  } = useInterviewStore();

  useEffect(() => {
    // If there's a candidate in the store, we are in an active interview
    if (currentCandidate && currentCandidate.status !== 'completed') {
      setStep('interview');
    }
  }, [currentCandidate]);

  const startNewInterview = (data: NewCandidateData) => {
    // NOTE: Questions are generated dynamically by InterviewChat using the AI service.
    // The questionSetIndex state and increment are currently unused in the dynamic flow, 
    // but kept in the destructured props for minimal change.
    
    // Create a new candidate
    const newCandidate: Candidate = {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeText: data.resumeText,
      resumeDataUrl: data.resumeDataUrl, // Included from previous merge resolution
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
    // incrementQuestionSetIndex(); // Disabled as we are not cycling pre-generated sets
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