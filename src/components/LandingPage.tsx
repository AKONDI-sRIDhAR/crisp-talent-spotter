import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MessageSquare, Sparkles, Timer } from 'lucide-react';
import LiquidEther from './LiquidEther';
import { useInterviewStore } from '@/store/interviewStore';

const LandingPage: React.FC = () => {
  const { setCurrentMode } = useInterviewStore();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background to-muted/20">
      {/* LiquidEther Background */}
      <div className="absolute inset-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div 
          className="text-center space-y-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Crisp
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              AI-Powered Interview Assistant
            </motion.p>
            
            <motion.p 
              className="text-lg text-muted-foreground/80 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Experience the future of technical interviews with dynamic AI-generated questions, 
              real-time scoring, and intelligent candidate evaluation.
            </motion.p>
          </div>

          {/* Mode Selection Cards */}
          <motion.div 
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {/* Interviewee Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                
                <h3 className="text-2xl font-bold">Interviewee</h3>
                
                <p className="text-muted-foreground">
                  Take your technical interview with AI-generated questions and real-time feedback.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>Timed Questions</span>
                  </div>
                  <div className="text-xs opacity-75">6 Questions • Easy → Medium → Hard</div>
                </div>
                
                <Button 
                  onClick={() => setCurrentMode('interviewee')}
                  className="w-full mt-6"
                  size="lg"
                >
                  Start Interview
                </Button>
              </CardContent>
            </Card>

            {/* Interviewer Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:border-accent/50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                
                <h3 className="text-2xl font-bold">Interviewer</h3>
                
                <p className="text-muted-foreground">
                  View candidate performance, scores, and AI-generated summaries.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Analytics</span>
                  </div>
                  <div className="text-xs opacity-75">Scores • Summaries • Chat History</div>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => setCurrentMode('interviewer-login')}
                  className="w-full mt-6 border-accent/50 hover:bg-accent/10"
                  size="lg"
                >
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Preview */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span>Real-time Scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Candidate Analytics</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;