import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Timer from '@/components/ui/timer';
import { useInterviewStore, Candidate } from '@/store/interviewStore';
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  options?: string[];
}

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
    apiKey // RESOLUTION: Including apiKey from the store
  } = useInterviewStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
    } else if (timerActive && timeRemaining <= 0) {
      handleTimeUp();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerActive, timeRemaining]);

  const generateNextQuestion = async () => {
    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (!latestCandidate) return;

    // API Key Check (Critical functionality)
    if (!apiKey) {
      // If key is missing in store, treat as a local error and stop processing
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
        content: `I apologize, but an unexpected error occurred. This may be due to a missing or invalid API key. Please contact the administrator.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentCandidate) return;
    
    // Check if the API key is locally missing (assuming VITE_GEMINI_API_KEY is not set globally
    // and must be handled by the user input logic on the Landing Page.)
    // If the apiKey from the store is missing, we must set the warning state.
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
    }

    if (currentCandidate.currentQuestionIndex >= 0 && messages.length > 0) {
      generateNextQuestion();
    }
  }, [currentCandidate?.currentQuestionIndex, apiKey]); // Depend on apiKey to restart if user enters it

  useEffect(() => {
    if (currentCandidate && !apiKeyMissing && messages.length === 1 && messages[0].id === 'welcome') {
      generateNextQuestion();
    }
  }, [messages.length, apiKeyMissing]);

  const handleSubmitAnswer = async () => {
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
  };

  const handleTimeUp = () => {
    setSelectedOption(prev => prev || 'No answer selected due to time limit.');
    handleSubmitAnswer();
  };

  const finishInterviewProcess = async () => {
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

        // Conditional scoring logic (Avoids API call for known time-out answers)
        if (answer.answer !== 'No answer selected due to time limit.') {
          // Pass apiKey to the service call
          const aiResult = await aiService.scoreAnswer(
            answer.question,
            answer.answer,
            answer.difficulty,
            apiKey! // apiKey is checked at start of finishInterviewProcess if we adopt the earlier logic
          );
          score = aiResult.score;
          comment = aiResult.comment;
        }
        
        const weightedScore = (score / 10) * scoreWeights[answer.difficulty];

        const scoredAnswer = {
          ...answer,
          aiScore: score, // Keep original 0-10 score for AI feedback
          aiComment: comment,
        };
        
        scoredAnswers.push(scoredAnswer);
        finalTotalScore += weightedScore;
      }

      // Pass apiKey to the service call
      const { summary } = await aiService.generateFinalSummary(
        scoredAnswers,
        latestCandidate.name,
        latestCandidate.resumeSummary || null, // Pass resume summary from candidate state
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

      // Conditional logic for the final message content
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
        score: 0 
      };
      finishInterview(candidateOnError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentCandidate) return null;

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

  const progress = (currentCandidate.currentQuestionIndex / 6) * 100;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{currentCandidate.name}</h2>
            <p className="text-sm text-muted-foreground">Technical Interview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">Question {Math.min(currentCandidate.currentQuestionIndex + 1, 6)}/6</div>
              <Progress value={progress} className="w-32" />
            </div>
            {currentQuestion && timerActive && <Timer timeRemaining={timeRemaining} totalTime={currentQuestion.timeLimit} difficulty={currentQuestion.difficulty} onTimeUp={handleTimeUp} isActive={timerActive} />}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-2xl ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card/80 backdrop-blur-sm'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {message.type === 'ai' ? <Bot className="w-6 h-6 text-primary flex-shrink-0 mt-1" /> : <User className="w-6 h-6 text-primary-foreground flex-shrink-0 mt-1" />}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                        {message.isQuestion && message.options && currentQuestion && timerActive && (
                          <div className="mt-4 space-y-2">
                            {message.options.map((option, index) => (
                              <button key={index} onClick={() => setSelectedOption(option)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedOption === option ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{message.timestamp.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-primary animate-pulse" />
                    <div className="flex space-x-1">
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
      {currentQuestion && timerActive && selectedOption && (
        <div className="border-t bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Button onClick={handleSubmitAnswer} disabled={!selectedOption || isLoading} size="lg" className="px-8">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit Answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewChat;
