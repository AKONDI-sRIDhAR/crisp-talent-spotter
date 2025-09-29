import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Bot, Sparkles, Timer, ArrowRight, Zap, Settings, X, CheckCircle2 } from 'lucide-react';
import LiquidEther from './LiquidEther';
import { useInterviewStore } from '@/store/interviewStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LandingPage: React.FC = () => {
  const { 
    setCurrentMode, 
    setCurrentCandidate, 
    apiKey, 
    setApiKey 
  } = useInterviewStore();

  const [showSettings, setShowSettings] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [keySaved, setKeySaved] = useState(!!apiKey);

  const handleSaveKey = () => {
    setApiKey(localApiKey);
    setKeySaved(!!localApiKey);
    setShowSettings(false);
  };

  const handleClearKey = () => {
    setApiKey(null);
    setLocalApiKey('');
    setKeySaved(false);
  };

  const renderSettingsModal = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>AI Service Settings</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API Key. This key is stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Gemini API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your AI API Key (AIzaSy...)"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button onClick={handleSaveKey} disabled={!localApiKey} className="flex-1">
              {keySaved ? "Update Key" : "Save Key"}
            </Button>
            <Button onClick={handleClearKey} variant="secondary" disabled={!keySaved}>
              Clear Key
            </Button>
          </div>
        </div>
        
        {keySaved && (
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>API Key successfully saved for this session.</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/10">
      {renderSettingsModal()}

      {/* LiquidEther Background */}
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

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div 
          className="text-center space-y-12 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Settings Button */}
          <div className="absolute top-4 right-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowSettings(true)}
              className={keySaved ? "border-green-500 hover:bg-green-500/10" : "border-destructive/50 hover:bg-destructive/10"}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Header */}
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
            
            <motion.h1 
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Crisp
            </motion.h1>
            
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

          {/* Mode Selection Cards */}
          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {/* Interviewee Card */}
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
                      setCurrentMode('interviewee');
                      setCurrentCandidate(null);
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

            {/* Interviewer Card */}
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
                    onClick={() => setCurrentMode('interviewer-login')}
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

          {/* Features Footer */}
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
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 backdrop-blur-sm">
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