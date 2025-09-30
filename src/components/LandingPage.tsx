import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Bot, Sparkles, Timer, ArrowRight, Zap } from 'lucide-react';
import LiquidEther from './LiquidEther';
import ScrambledText from './ScrambledText';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentMode, setCurrentCandidate, setInterviewStep } from '@/store/interviewSlice';

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/10">
      <div className="absolute inset-0 opacity-30">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={15}
          cursorSize={80}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.4}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.3}
          autoIntensity={1.8}
          takeoverDuration={0.4}
          autoResumeDelay={4000}
          autoRampDuration={0.8}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div 
          className="text-center space-y-12 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative inline-block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Bot className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <ScrambledText 
                className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight scrambled-text-demo"
                radius={100}
                duration={1.2}
                speed={0.5}
                scrambleChars=".:"
              >
                SWIPE AI Interview Assistant
              </ScrambledText>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              <p className="text-2xl md:text-3xl font-medium text-foreground/90">
                AI Technical Interview Platform
              </p>
              
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                Experience next-generation technical assessments with dynamic AI questions, 
                real-time evaluation, and intelligent candidate insights.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="glass-card hover-lift glow-on-hover h-full group cursor-pointer">
                <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Bot className="w-8 h-8 text-primary-foreground" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">Take Interview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Experience AI-powered technical assessment with dynamic questions and instant feedback.
                    </p>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Dynamic AI Questions</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Timer className="w-4 h-4 text-primary" />
                      <span>Real-time Evaluation</span>
                    </div>
                    <div className="text-xs text-muted-foreground/60 pt-2">
                      6 Questions • Progressive Difficulty • 15-20 minutes
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      dispatch(setCurrentMode('interviewee'));
                      dispatch(setCurrentCandidate(null));
                      dispatch(setInterviewStep('form'));
                    }}
                    className="w-full mt-6 h-12 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg group-hover:shadow-2xl"
                    size="lg"
                  >
                    Start Interview
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="glass-card hover-lift glow-on-hover h-full group cursor-pointer">
                <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">View Results</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Access comprehensive candidate analytics, scores, and AI-generated performance summaries.
                    </p>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>AI Performance Analysis</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span>Candidate Dashboard</span>
                    </div>
                    <div className="text-xs text-muted-foreground/60 pt-2">
                      Detailed Scores • Interview History • Export Reports
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => dispatch(setCurrentMode('interviewer-login'))}
                    className="w-full mt-6 h-12 text-lg font-medium border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 shadow-lg group-hover:shadow-2xl"
                    size="lg"
                  >
                    Access Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div 
            className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground/70 pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI-Powered Assessment</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 backdrop-blur-sm">
              <Timer className="w-4 h-4 text-primary" />
              <span>Instant Scoring</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded--full bg-muted/20 backdrop-blur-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>Detailed Analytics</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;