import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from './components/LandingPage';
import IntervieweePage from './components/IntervieweePage';
import InterviewerDashboard from './components/InterviewerDashboard';
import InterviewerLogin from './components/InterviewerLogin';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setCurrentMode } from './store/interviewSlice';
import { store, persistor } from './store/store';

const queryClient = new QueryClient();

const AppContent = () => {
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector((state) => state.interview.currentMode);

  const renderCurrentPage = () => {
    switch (currentMode) {
      case 'interviewee':
        return <IntervieweePage />;
      case 'interviewer-login':
        return (
          <InterviewerLogin
            onLogin={() => dispatch(setCurrentMode('interviewer'))}
            onBack={() => dispatch(setCurrentMode('landing'))}
          />
        );
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;
