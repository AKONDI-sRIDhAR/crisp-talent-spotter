import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText?: string;
  resumeFile?: File;
  score: number;
  status: 'pending' | 'in-progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  answers: InterviewAnswer[];
  aiSummary?: string;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
}

export interface InterviewAnswer {
  question: string;
  answer: string;
  timeLimit: number;
  timeUsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  aiScore: number;
  aiComment?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  options?: string[];
}

interface InterviewStore {
  // Current mode
  currentMode: 'landing' | 'interviewee' | 'interviewer' | 'interviewer-login';
  setCurrentMode: (mode: 'landing' | 'interviewee' | 'interviewer' | 'interviewer-login') => void;

  // Current candidate (for interviewee mode)
  currentCandidate: Candidate | null;
  setCurrentCandidate: (candidate: Candidate | null) => void;

  // All candidates (for interviewer dashboard)
  candidates: Candidate[];
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;

  // Interview state
  currentQuestion: InterviewQuestion | null;
  setCurrentQuestion: (question: InterviewQuestion | null) => void;
  
  timerActive: boolean;
  setTimerActive: (active: boolean) => void;
  
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;

  // Interview flow
  submitAnswer: (answer: string, timeUsed: number) => void;
  nextQuestion: () => void;
  finishInterview: (finalCandidate: Candidate) => void;

  // Resume data extraction
  extractedData: {
    name?: string;
    email?: string;
    phone?: string;
  };
  setExtractedData: (data: { name?: string; email?: string; phone?: string }) => void;

  // API Key
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      currentMode: 'landing',
      setCurrentMode: (mode) => set({ currentMode: mode }),

      currentCandidate: null,
      setCurrentCandidate: (candidate) => set({ currentCandidate: candidate }),

      candidates: [],
      addCandidate: (candidate) => set((state) => ({ 
        candidates: [...state.candidates, candidate] 
      })),
      updateCandidate: (id, updates) => set((state) => ({
        candidates: state.candidates.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
        currentCandidate: state.currentCandidate?.id === id 
          ? { ...state.currentCandidate, ...updates }
          : state.currentCandidate
      })),

      currentQuestion: null,
      setCurrentQuestion: (question) => set({ currentQuestion: question }),

      timerActive: false,
      setTimerActive: (active) => set({ timerActive: active }),

      timeRemaining: 0,
      setTimeRemaining: (time) => set({ timeRemaining: time }),

      submitAnswer: (answer, timeUsed) => {
        const state = get();
        if (!state.currentCandidate || !state.currentQuestion) return;

        const newAnswer: InterviewAnswer = {
          question: state.currentQuestion.question,
          answer,
          timeLimit: state.currentQuestion.timeLimit,
          timeUsed,
          difficulty: state.currentQuestion.difficulty,
          aiScore: 0, // Will be calculated at the end
        };

        const updatedCandidate = {
          ...state.currentCandidate,
          answers: [...state.currentCandidate.answers, newAnswer],
        };

        set({
          currentCandidate: updatedCandidate,
          timerActive: false,
        });

        // Update candidates array
        set((state) => ({
          candidates: state.candidates.map(c => 
            c.id === updatedCandidate.id ? updatedCandidate : c
          )
        }));
      },

      nextQuestion: () => {
        const state = get();
        if (!state.currentCandidate) return;

        const nextIndex = state.currentCandidate.currentQuestionIndex + 1;
        
        set((state) => ({
          currentCandidate: state.currentCandidate ? {
            ...state.currentCandidate,
            currentQuestionIndex: nextIndex,
          } : null,
          currentQuestion: null,
        }));
      },

      finishInterview: (finalCandidate) => {
        set((state) => ({
          // Update the main list of candidates with the final, scored data
          candidates: state.candidates.map(c =>
            c.id === finalCandidate.id ? finalCandidate : c
          ),
          // Clear the session
          currentCandidate: null,
          currentQuestion: null,
          currentMode: 'landing',
        }));
      },

      extractedData: {},
      setExtractedData: (data) => set({ extractedData: data }),

      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'interview-store',
      partialize: (state) => ({
        candidates: state.candidates,
        currentCandidate: state.currentCandidate,
        extractedData: state.extractedData,
        apiKey: state.apiKey,
      }),
    }
  )
);