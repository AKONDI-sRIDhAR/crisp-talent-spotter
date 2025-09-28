import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Timer from '@/components/ui/timer';
import { useInterviewStore } from '@/store/interviewStore';
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
    updateCandidate
  } = useInterviewStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer logic
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timerActive && timeRemaining <= 0) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  // Initialize interview
  useEffect(() => {
    if (currentCandidate && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Welcome, ${currentCandidate.name}! I'm your AI interviewer. You'll be taking a technical interview with 6 questions of increasing difficulty. Each question has a time limit, and I'll provide feedback on your answers. Let's begin with your first question!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      generateNextQuestion();
    }
  }, [currentCandidate]);

  const generateNextQuestion = async () => {
    // Get the LATEST state directly from the store to prevent stale closures
    const latestCandidate = useInterviewStore.getState().currentCandidate;

    if (!latestCandidate) return;

    const questionIndex = latestCandidate.currentQuestionIndex;
    if (questionIndex >= 6) {
      await finishInterviewProcess();
      return;
    }

    setIsLoading(true);

    try {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
      const difficulty = difficulties[questionIndex];
      
      const previousQuestions = latestCandidate.answers.map(a => a.question);
      const questionData = await aiService.generateQuestion(difficulty, previousQuestions);
      
      setCurrentQuestion(questionData);
      setTimeRemaining(questionData.timeLimit);
      
      const questionMessage: Message = {
        id: `question-${questionIndex}`,
        type: 'ai',
        content: `**Question ${questionIndex + 1}/6 (${difficulty.toUpperCase()} - ${questionData.timeLimit}s)**\n\n${questionData.question}`,
        timestamp: new Date(),
        isQuestion: true,
        options: questionData.options
      };
      
      setMessages(prev => [...prev, questionMessage]);
      setTimerActive(true);
    } catch (error) {
      console.error('Error generating question:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'I apologize, but there was an error generating the next question. Please try refreshing the page.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || !currentCandidate) return;

    const timeUsed = currentQuestion.timeLimit - timeRemaining;
    
    // Add user message
    const userMessage: Message = {
      id: `answer-${Date.now()}`,
      type: 'user',
      content: selectedOption,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTimerActive(false);
    setSelectedOption('');
    setIsLoading(true);

    // Submit answer to store (no scoring here)
    submitAnswer(selectedOption, timeUsed);
    
    // Add transition message
    const transitionMessage: Message = {
      id: `transition-${Date.now()}`,
      type: 'ai',
      content: 'Answer recorded! Moving to the next question...',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transitionMessage]);
    
    // Move to next question
    nextQuestion();
    setTimeout(() => {
      generateNextQuestion();
      setIsLoading(false);
    }, 1500);
  };

  const handleTimeUp = () => {
    if (!selectedOption) {
      setSelectedOption('No answer selected due to time limit.');
    }
    handleSubmitAnswer();
  };

  const finishInterviewProcess = async () => {
    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (!latestCandidate) return;

    setIsLoading(true);

    const scoreWeights = {
      easy: 0.5,
      medium: 2,
      hard: 5,
    };

    try {
      // Score all answers at the end
      const scoredAnswers = [];
      let finalTotalScore = 0;

      for (const answer of latestCandidate.answers) {
        const { score, comment } = await aiService.scoreAnswer(
          answer.question,
          answer.answer,
          answer.difficulty
        );
        
        const weightedScore = (score / 10) * scoreWeights[answer.difficulty];

        const scoredAnswer = {
          ...answer,
          aiScore: score, // Keep original 0-10 score for AI feedback
          aiComment: comment,
        };
        
        scoredAnswers.push(scoredAnswer);
        finalTotalScore += weightedScore;
      }

      const { summary } = await aiService.generateFinalSummary(
        scoredAnswers,
        latestCandidate.name
      );

      const finalCandidate: Candidate = {
        ...latestCandidate,
        answers: scoredAnswers,
        score: finalTotalScore,
        aiSummary: summary,
        status: 'completed',
        endTime: new Date()
      };

      const finalMessage: Message = {
        id: 'final',
        type: 'ai',
        content: `🎉 **Interview Complete!**\n\n**Final Score: ${finalTotalScore.toFixed(1)}/15**\n\n${summary}\n\nThank you for taking the interview, ${latestCandidate.name}!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, finalMessage]);
      
      setTimeout(() => {
        finishInterview(finalCandidate);
      }, 5000);

    } catch (error) {
      console.error('Error finishing interview:', error);
      // Even on error, we should try to finish the interview with available data
      const errorCandidate = { ...latestCandidate, status: 'completed' as const, endTime: new Date() };
      finishInterview(errorCandidate);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentCandidate) return null;

  const progress = (currentCandidate.currentQuestionIndex / 6) * 100;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{currentCandidate.name}</h2>
            <p className="text-sm text-muted-foreground">Technical Interview</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">
                Question {currentCandidate.currentQuestionIndex + 1}/6
              </div>
              <Progress value={progress} className="w-32" />
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-2xl ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/80 backdrop-blur-sm'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {message.type === 'ai' ? (
                        <Bot className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      ) : (
                        <User className="w-6 h-6 text-primary-foreground flex-shrink-0 mt-1" />
                      )}
                      
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* MCQ Options */}
                        {message.isQuestion && message.options && currentQuestion && timerActive && (
                          <div className="mt-4 space-y-2">
                            {message.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedOption(option)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  selectedOption === option
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className={`text-xs mt-2 ${
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
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
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

      {/* Submit Button */}
      {currentQuestion && timerActive && selectedOption && (
        <div className="border-t bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || isLoading}
              size="lg"
              className="px-8"
            >
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