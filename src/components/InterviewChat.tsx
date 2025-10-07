import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Timer from '@/components/ui/timer';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setCurrentQuestion, 
  setTimerActive, 
  setTimeRemaining, 
  submitAnswer, 
  nextQuestion, 
  finishInterview,
  Candidate 
} from '@/store/interviewSlice';
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
  const dispatch = useAppDispatch();
  const currentCandidate = useAppSelector((state) => state.interview.currentCandidate);
  const currentQuestion = useAppSelector((state) => state.interview.currentQuestion);
  const timerActive = useAppSelector((state) => state.interview.timerActive);
  const timeRemaining = useAppSelector((state) => state.interview.timeRemaining);
  const apiKey = useAppSelector((state) => state.interview.apiKey);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const finishInterviewProcess = useCallback(async () => {
    if (!currentCandidate) return;
    const latestCandidate = currentCandidate;

    setIsLoading(true);
    try {
      const scoreWeights = { easy: 0.5, medium: 2, hard: 5 };
      let finalTotalScore = 0;
      const scoredAnswers = [];

      console.log('Starting scoring process for', latestCandidate.answers.length, 'answers');

      for (const answer of latestCandidate.answers) {
        let score = 0;
        let comment = 'No answer was provided before the time ran out.';

        if (answer.answer && answer.answer !== 'No answer selected due to time limit.') {
          try {
            const aiResult = await aiService.scoreAnswer(
              answer.question,
              answer.answer,
              answer.difficulty,
              apiKey!
            );
            score = aiResult.score;
            comment = aiResult.comment;
            console.log(`Scored ${answer.difficulty} question:`, score, '/', 10);
          } catch (error) {
            console.error('Error scoring answer:', error);
            score = 0;
            comment = 'Error occurred during scoring.';
          }
        }

        const weightedScore = (score / 10) * scoreWeights[answer.difficulty];
        const scoredAnswer = { ...answer, aiScore: score, aiComment: comment };

        scoredAnswers.push(scoredAnswer);
        finalTotalScore += weightedScore;
      }

      console.log('Total weighted score:', finalTotalScore, '/ 15');

      let summary = '';
      try {
        const summaryResult = await aiService.generateFinalSummary(
          scoredAnswers,
          latestCandidate.name,
          null,
          apiKey!
        );
        summary = summaryResult.summary;
        console.log('Generated summary successfully');
      } catch (error) {
        console.error('Error generating summary:', error);
        summary = `${latestCandidate.name} completed the interview with a score of ${finalTotalScore.toFixed(1)}/15. The detailed AI summary could not be generated due to an error.`;
      }

      const finalCandidate: Candidate = {
        ...latestCandidate,
        answers: scoredAnswers,
        score: finalTotalScore,
        aiSummary: summary,
        status: 'completed',
        endTime: new Date()
      };

      console.log('Final candidate data:', { 
        name: finalCandidate.name, 
        score: finalCandidate.score, 
        answersCount: finalCandidate.answers.length,
        hasResume: !!finalCandidate.resumeDataUrl
      });

      const finalMessageContent = summary && !summary.includes('disabled')
        ? `🎉 **Interview Complete!**\n\n**Final Score: ${finalTotalScore.toFixed(1)}/15**\n\n${summary}\n\nThank you for taking the interview, ${latestCandidate.name}!`
        : `🎉 **Interview Complete!**\n\nThank you for taking the interview, ${latestCandidate.name}! Your responses have been saved.`;

      setMessages(prev => [...prev, { id: 'final', type: 'ai', content: finalMessageContent, timestamp: new Date() }]);
      setTimeout(() => dispatch(finishInterview(finalCandidate)), 5000);
    } catch (error) {
      console.error('Error finishing interview:', error);
      const candidateOnError = {
        ...latestCandidate,
        answers: latestCandidate.answers.map(a => ({ ...a, aiScore: 0, aiComment: 'Error during scoring' })),
        status: 'completed' as const,
        endTime: new Date(),
        aiSummary: `${latestCandidate.name} completed the interview. An error occurred during the final analysis.`,
        score: 0,
      };
      dispatch(finishInterview(candidateOnError));
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, dispatch, currentCandidate]);

  const generateNextQuestion = useCallback(async () => {
    if (!currentCandidate) return;
    const latestCandidate = currentCandidate;

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
      
      const questionData = await aiService.generateQuestion(difficulty, previousQuestions, apiKey);
      
      dispatch(setCurrentQuestion(questionData));
      dispatch(setTimeRemaining(questionData.timeLimit));
      
      const questionMessage: Message = {
        id: `question-${latestCandidate.currentQuestionIndex}`,
        type: 'ai',
        content: `Question ${latestCandidate.currentQuestionIndex + 1}/6 (${difficulty.toUpperCase()} - ${questionData.timeLimit}s)\n\n${questionData.question}`,
        timestamp: new Date(),
        isQuestion: true,
        options: questionData.options,
      };
      
      setMessages(prev => [...prev, questionMessage]);
      dispatch(setTimerActive(true));
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
  }, [apiKey, dispatch, currentCandidate, finishInterviewProcess]);

  const handleSubmitAnswer = useCallback(async (answerToSubmit: string) => {
    if (!answerToSubmit || !currentQuestion || !currentCandidate) return;

    const timeUsed = currentQuestion.timeLimit - timeRemaining;
    const userMessage: Message = { id: `answer-${Date.now()}`, type: 'user', content: answerToSubmit, timestamp: new Date() };

    setMessages(prev => [...prev, userMessage]);
    dispatch(setTimerActive(false));
    setSelectedOption('');
    setIsLoading(true);

    dispatch(submitAnswer({ answer: answerToSubmit, timeUsed }));
    dispatch(nextQuestion());

    // Check if interview is complete after answer is submitted
    const updatedQuestionIndex = currentCandidate.currentQuestionIndex + 1;
    if (updatedQuestionIndex >= 6) {
      await finishInterviewProcess();
    } else {
      const transitionMessage: Message = { id: `transition-${Date.now()}`, type: 'ai', content: 'Answer recorded! Moving to the next question...', timestamp: new Date() };
      setMessages(prev => [...prev, transitionMessage]);
      setIsLoading(false);
    }
  }, [currentQuestion, currentCandidate, timeRemaining, dispatch, finishInterviewProcess]);

  const handleTimeUp = useCallback(() => {
    handleSubmitAnswer(selectedOption || 'No answer selected due to time limit.');
  }, [handleSubmitAnswer, selectedOption]);

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => dispatch(setTimeRemaining(timeRemaining - 1)), 1000);
    } else if (timerActive && timeRemaining <= 0) {
      handleTimeUp();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerActive, timeRemaining, dispatch, handleTimeUp]);

  useEffect(() => {
    if (!currentCandidate) return;

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
  }, [currentCandidate, messages, isLoading, generateNextQuestion]);

  if (!currentCandidate) return null;

  const progress = (currentCandidate.currentQuestionIndex / 6) * 100;


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
                onClick={() => handleSubmitAnswer(selectedOption)}
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