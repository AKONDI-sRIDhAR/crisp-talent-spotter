import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  // RESOLUTION: Dynamic question generation logic (re-implementing the intended async logic)
  const generateNextQuestion = async () => {
    // Get the LATEST state directly from the store to prevent stale closures
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
        content: `Question ${questionIndex + 1}/6 (${difficulty.toUpperCase()} - ${questionData.timeLimit}s)\n\n${questionData.question}`,
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
        content: `I apologize, but an unexpected error occurred. Please try refreshing the page.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize interview and listen for question index changes
  useEffect(() => {
    if (!currentCandidate) return;

    // 1. Initial welcome message (only if no messages exist)
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Welcome, ${currentCandidate.name}! I'm your AI interviewer. You'll be taking a technical interview with 6 questions of increasing difficulty. Each question has a time limit, and I'll provide feedback on your answers. Let's begin with your first question!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }

    // 2. Start/Advance the interview by generating the next question
    // We only want to generate a new question if the index has advanced
    // AND we are not currently loading the very first question (messages.length > 0)
    if (currentCandidate.currentQuestionIndex >= 0 && messages.length > 0) {
        generateNextQuestion();
    }
    
  }, [currentCandidate?.currentQuestionIndex]); // Dependency on the index ensures we try to load the next question

  // Call generateNextQuestion once after the welcome message is set
  useEffect(() => {
    if (currentCandidate && messages.length === 1 && messages[0].id === 'welcome') {
        generateNextQuestion();
    }
  }, [messages.length]); // Run only when messages.length changes to 1 (i.e., after welcome)

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
    
    // Check if the interview is over
    const latestCandidate = useInterviewStore.getState().currentCandidate;
    if (latestCandidate && latestCandidate.answers.length >= 6) {
      await finishInterviewProcess();
      return;
    }

    // Add transition message (Cleaned up redundant comment)
    const transitionMessage: Message = {
      id: `transition-${Date.now()}`,
      type: 'ai',
      content: 'Answer recorded! Moving to the next question...',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transitionMessage]);
    
    // Move to next question (This increments the index, triggering the useEffect above)
    nextQuestion();
    setIsLoading(false); // Reset loading state
  };

  const handleTimeUp = () => {
    if (!selectedOption) {
      // Set a flag answer for time up
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
        let score = 0;
        let comment = 'No answer was provided before the time ran out.';

        // Conditional scoring logic (Avoids API call for known time-out answers)
        if (answer.answer !== 'No answer selected due to time limit.') {
          // Pass apiKey to the service call
          const aiResult = await aiService.scoreAnswer(
            answer.question,
            answer.answer,
            answer.difficulty,
            apiKey
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
        apiKey
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
      const finalMessageContent = apiKey && summary && !summary.includes('disabled')
        ? `🎉 **Interview Complete!**\n\n**Final Score: ${finalTotalScore.toFixed(1)}/15**\n\n${summary}\n\nThank you for taking the interview, ${latestCandidate.name}!`
        : `🎉 **Interview Complete!**\n\nThank you for taking the interview, ${latestCandidate.name}! Your responses have been saved.`;

      const finalMessage: Message = {
        id: 'final',
        type: 'ai',
        content: finalMessageContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, finalMessage]);
      
      setTimeout(() => {
        finishInterview(finalCandidate);
      }, 5000);

    } catch (error) {
      console.error('Error finishing interview:', error);
      // Using the more detailed error object for state persistence
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