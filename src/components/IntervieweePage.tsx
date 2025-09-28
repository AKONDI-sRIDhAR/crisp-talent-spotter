import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import InterviewChat from './InterviewChat';
import { useInterviewStore, Candidate } from '@/store/interviewStore';

const IntervieweePage: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'interview'>('upload');
  
  const { 
    currentCandidate,
    setCurrentCandidate,
    extractedData,
    addCandidate,
    setCurrentMode,
    setShowWelcomeBack
  } = useInterviewStore();

  // Check if we have an existing candidate and should show welcome back
  useEffect(() => {
    const storedData = localStorage.getItem('interview-store');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed.state?.currentCandidate?.status === 'in-progress') {
        setShowWelcomeBack(true);
      }
    }
  }, [setShowWelcomeBack]);

  useEffect(() => {
    if (currentCandidate && currentCandidate.status !== 'completed') {
      setStep('interview');
    }
  }, [currentCandidate]);


    // Create a new candidate
    const candidate: Candidate = {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,

      score: 0,
      status: 'in-progress',
      startTime: new Date(),
      answers: [],
      currentQuestionIndex: 0
    };

    setCurrentCandidate(candidate);
    addCandidate(candidate);
    setStep('interview');
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
    </div>
  );
};

export default IntervieweePage;