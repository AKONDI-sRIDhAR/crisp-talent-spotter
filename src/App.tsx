import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from './components/LandingPage';
import IntervieweePage from './components/IntervieweePage';
import InterviewerDashboard from './components/InterviewerDashboard';
import WelcomeBackModal from './components/WelcomeBackModal';
import { useInterviewStore } from './store/interviewStore';

const queryClient = new QueryClient();

const App = () => {
  const { 
    currentMode, 
    currentCandidate, 
    setShowWelcomeBack,
    showWelcomeBack 
  } = useInterviewStore();

  // Check for incomplete interviews on app load
  useEffect(() => {
    if (currentCandidate && 
        currentCandidate.status === 'in-progress' && 
        currentCandidate.answers.length > 0 && 
        currentCandidate.answers.length < 6) {
      setShowWelcomeBack(true);
    }
  }, [currentCandidate, setShowWelcomeBack]);

  const renderCurrentPage = () => {
    switch (currentMode) {
      case 'interviewee':
        return <IntervieweePage />;
      case 'interviewer':
        return <InterviewerDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          {renderCurrentPage()}
        </div>
        
        <Toaster />
        <Sonner />
        
        {/* Welcome Back Modal */}
        {showWelcomeBack && <WelcomeBackModal />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;