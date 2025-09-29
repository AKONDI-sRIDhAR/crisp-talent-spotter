import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Timer from '@/components/ui/timer';
import { useInterviewStore, Candidate } from '@/store/interviewStore'; // Assuming Candidate type is exported from store
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  options?: string[];
}

const InterviewChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const {
    currentCandidate,
    currentQuestion,
    setCurrentQuestion,
    timerActive,
    setTimerActive,
    timeRemaining,
    setTimeRemaining,
    submitAnswer,
    nextQuestion,
    finishInterview,
    apiKey
  } = useInterviewStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateNextQuestion = useCallback(async () => {
    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (!latestCandidate) return;

    // API Key Check (Critical functionality)
    if (!apiKey) {
      const errorMessage: Message = {
        id: `error-no-api-key`,
        type: 'ai',
        content: 'The API key is missing. Please set it on the homepage to begin the interview.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    const questionIndex = latestCandidate.currentQuestionIndex;
    if (questionIndex >= 6) {
      await finishInterviewProcess();
      return;
    }

    setIsLoading(true);
    try {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
      const difficulty = difficulties[latestCandidate.currentQuestionIndex];
      const previousQuestions = latestCandidate.answers.map(a => a.question);
      
      // Pass apiKey to the service call
      const questionData = await aiService.generateQuestion(difficulty, previousQuestions, apiKey);
      
      setCurrentQuestion(questionData);
      setTimeRemaining(questionData.timeLimit);
      
      const questionMessage: Message = {
        id: `question-${latestCandidate.currentQuestionIndex}`,
        type: 'ai',
        content: `Question ${latestCandidate.currentQuestionIndex + 1}/6 (${difficulty.toUpperCase()} - ${questionData.timeLimit}s)\n\n${questionData.question}`,
        timestamp: new Date(),
        isQuestion: true,
        options: questionData.options,
      };
      
      setMessages(prev => [...prev, questionMessage]);
      setTimerActive(true);
    } catch (error) {
      console.error('Error generating question:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: `I apologize, but there was an error generating the next question. Please try refreshing the page.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, finishInterviewProcess, setCurrentQuestion, setTimeRemaining, setTimerActive]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedOption || !currentQuestion || !currentCandidate) return;

    const timeUsed = currentQuestion.timeLimit - timeRemaining;
    const userMessage: Message = { id: `answer-${Date.now()}`, type: 'user', content: selectedOption, timestamp: new Date() };

    setMessages(prev => [...prev, userMessage]);
    setTimerActive(false);
    setSelectedOption('');
    setIsLoading(true);

    submitAnswer(selectedOption, timeUsed);

    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (latestCandidate && latestCandidate.answers.length >= 6) {
      await finishInterviewProcess();
      return;
    }

    const transitionMessage: Message = { id: `transition-${Date.now()}`, type: 'ai', content: 'Answer recorded! Moving to the next question...', timestamp: new Date() };
    setMessages(prev => [...prev, transitionMessage]);

    nextQuestion();
    setIsLoading(false);
  }, [selectedOption, currentQuestion, currentCandidate, timeRemaining, setTimerActive, submitAnswer, nextQuestion]);

  const handleTimeUp = useCallback(() => {
    setSelectedOption(prev => prev || 'No answer selected due to time limit.');
    handleSubmitAnswer();
  }, [handleSubmitAnswer]);

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
    } else if (timerActive && timeRemaining <= 0) {
      handleTimeUp();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerActive, timeRemaining, setTimeRemaining, handleTimeUp]);


  useEffect(() => {
    if (!currentCandidate) return;

    // Check if the API key is locally missing (from store)
    if (!apiKey) {
      setApiKeyMissing(true);
      return;
    }
    setApiKeyMissing(false);

    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Welcome, ${currentCandidate.name}! I'm your AI interviewer. You'll be taking a technical interview with 6 questions of increasing difficulty. Let's begin!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      return;
    }

    const questionAlreadyExists = messages.some(
      (m) => m.id === `question-${currentCandidate.currentQuestionIndex}`
    );

    if (!questionAlreadyExists && !isLoading) {
      generateNextQuestion();
    }
  }, [currentCandidate, messages, isLoading, generateNextQuestion, apiKey]);


  const finishInterviewProcess = useCallback(async () => {
    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (!latestCandidate) return;

    setIsLoading(true);
    try {
      const scoreWeights = { easy: 0.5, medium: 2, hard: 5 };
      let finalTotalScore = 0;
      const scoredAnswers = [];

      for (const answer of latestCandidate.answers) {
        let score = 0;
        let comment = 'No answer was provided before the time ran out.';

        if (answer.answer !== 'No answer selected due to time limit.') {
          // Pass apiKey to the service call
          const aiResult = await aiService.scoreAnswer(
            answer.question,
            answer.answer,
            answer.difficulty,
            apiKey!
          );
          score = aiResult.score;
          comment = aiResult.comment;
        }
        
        const weightedScore = (score / 10) * scoreWeights[answer.difficulty];
        const scoredAnswer = { ...answer, aiScore: score, aiComment: comment };
        
        scoredAnswers.push(scoredAnswer);
        finalTotalScore += weightedScore;
      }

      // Pass apiKey and resumeSummary to the service call
      const { summary } = await aiService.generateFinalSummary(
        scoredAnswers,
        latestCandidate.name,
        latestCandidate.resumeSummary || null,
        apiKey!
      );

      const finalCandidate: Candidate = {
        ...latestCandidate,
        answers: scoredAnswers,
        score: finalTotalScore,
        aiSummary: summary,
        status: 'completed',
        endTime: new Date()
      };

      const finalMessageContent = summary && !summary.includes('disabled')
        ? `🎉 **Interview Complete!**\n\n**Final Score: ${finalTotalScore.toFixed(1)}/15**\n\n${summary}\n\nThank you for taking the interview, ${latestCandidate.name}!`
        : `🎉 **Interview Complete!**\n\nThank you for taking the interview, ${latestCandidate.name}! Your responses have been saved.`;

      setMessages(prev => [...prev, { id: 'final', type: 'ai', content: finalMessageContent, timestamp: new Date() }]);
      setTimeout(() => finishInterview(finalCandidate), 5000);
    } catch (error) {
      console.error('Error finishing interview:', error);
      const candidateOnError = {
        ...latestCandidate,
        status: 'completed' as const,
        endTime: new Date(),
        aiSummary: 'An error occurred during the final analysis.',
        score: 0,
      };
      finishInterview(candidateOnError); 
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, finishInterview]);

  if (!currentCandidate) return null;

  const progress = (currentCandidate.currentQuestionIndex / 6) * 100;

  // Setup Guide component is only rendered if apiKey is missing
  const ApiKeySetupGuide: React.FC = () => (
    <div className="flex justify-center p-4">
      <Card className="max-w-2xl bg-orange-100 dark:bg-orange-900/30 border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="w-6 h-6" />
            Action Required: Set Up Your API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            To enable the AI-powered features of this application, you need to provide a Google AI API key.
          </p>
          <div className="space-y-3 text-sm bg-background/50 p-4 rounded-lg border">
            <p>
              <strong>Step 1:</strong> Create a new file named <code>.env.local</code> in the main project folder (the same folder that contains <code>package.json</code>).
            </p>
            <p>
              <strong>Step 2:</strong> Open the <code>.env.local</code> file and add the following line, replacing <code>YOUR_API_KEY_HERE</code> with your actual Google AI API key:
            </p>
            <pre className="p-2 bg-muted rounded-md text-xs overflow-x-auto">
              <code>VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE</code>
            </pre>
            <p>
              <strong>Step 3:</strong> Stop the development server (if it's running) and restart it with <code>bun run dev</code> for the changes to take effect.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (apiKeyMissing) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="border-b bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h2 className="text-xl font-bold">Initial Setup Required</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ApiKeySetupGuide />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl border-border/50 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {currentCandidate.name}
              </h2>
              <p className="text-sm text-muted-foreground">AI Technical Interview</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-medium mb-1">
                Question {Math.min(currentCandidate.currentQuestionIndex + 1, 6)}/6
              </div>
              <Progress value={progress} className="w-32 h-2" />
            </div>
            {currentQuestion && timerActive && (
              <Timer 
                timeRemaining={timeRemaining} 
                totalTime={currentQuestion.timeLimit} 
                difficulty={currentQuestion.difficulty} 
                onTimeUp={handleTimeUp} 
                isActive={timerActive} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div 
                key={message.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`
                  max-w-2xl glass-card shadow-xl hover-lift transition-all duration-300
                  ${message.type === 'user' 
                    ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary/20' 
                    : 'bg-card/90 backdrop-blur-lg border-border/30'
                  }
                `}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {message.type === 'ai' ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        {message.isQuestion && message.options && currentQuestion && timerActive && (
                          <div className="mt-6 space-y-3">
                            {message.options.map((option, index) => (
                              <motion.button 
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedOption(option)} 
                                className={`
                                  w-full text-left p-4 rounded-xl border transition-all duration-300 font-medium
                                  ${selectedOption === option 
                                    ? 'border-primary bg-primary/10 text-primary shadow-lg ring-2 ring-primary/20' 
                                    : 'border-border/50 hover:border-primary/50 hover:bg-muted/30 hover:shadow-md'
                                  }
                                `}
                              >
                                {option}
                              </motion.button>
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-3 ${
                          message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-start"
            >
              <Card className="glass-card shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Submit button */}
      {currentQuestion && timerActive && selectedOption && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t bg-card/50 backdrop-blur-xl border-border/50 p-6"
        >
          <div className="max-w-4xl mx-auto flex justify-center">
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={!selectedOption || isLoading} 
              size="lg" 
              className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Submit Answer
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewChat;