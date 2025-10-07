import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeDataUrl?: string;
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

interface InterviewState {
  currentMode: 'landing' | 'interviewee' | 'interviewer' | 'interviewer-login';
  currentCandidate: Candidate | null;
  candidates: Candidate[];
  interviewStep: 'form' | 'pre-interview-check' | 'interview';
  currentQuestion: InterviewQuestion | null;
  timerActive: boolean;
  timeRemaining: number;
  apiKey: string;
  extractedData: {
    name?: string;
    email?: string;
    phone?: string;
  };
  questionSetIndex: number;
}

const initialState: InterviewState = {
  currentMode: 'landing',
  currentCandidate: null,
  candidates: [],
  interviewStep: 'form',
  currentQuestion: null,
  timerActive: false,
  timeRemaining: 0,
  apiKey: 'AIzaSyCgbyLeYVkhGNLjCUQwv3SPLaZbMPYOxaY',
  extractedData: {},
  questionSetIndex: 0,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentMode: (state, action: PayloadAction<'landing' | 'interviewee' | 'interviewer' | 'interviewer-login'>) => {
      state.currentMode = action.payload;
    },
    setCurrentCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.currentCandidate = action.payload;
    },
    setInterviewStep: (state, action: PayloadAction<'form' | 'pre-interview-check' | 'interview'>) => {
      state.interviewStep = action.payload;
    },
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.candidates[index] = { ...state.candidates[index], ...action.payload.updates };
      }
      if (state.currentCandidate?.id === action.payload.id) {
        state.currentCandidate = { ...state.currentCandidate, ...action.payload.updates };
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<InterviewQuestion | null>) => {
      state.currentQuestion = action.payload;
    },
    setTimerActive: (state, action: PayloadAction<boolean>) => {
      state.timerActive = action.payload;
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setExtractedData: (state, action: PayloadAction<{ name?: string; email?: string; phone?: string }>) => {
      state.extractedData = action.payload;
    },
    submitAnswer: (state, action: PayloadAction<{ answer: string; timeUsed: number }>) => {
      if (!state.currentCandidate || !state.currentQuestion) return;

      const newAnswer: InterviewAnswer = {
        question: state.currentQuestion.question,
        answer: action.payload.answer,
        timeLimit: state.currentQuestion.timeLimit,
        timeUsed: action.payload.timeUsed,
        difficulty: state.currentQuestion.difficulty,
        aiScore: 0,
      };

      state.currentCandidate.answers.push(newAnswer);
      state.timerActive = false;

      const candidateIndex = state.candidates.findIndex(c => c.id === state.currentCandidate!.id);
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex] = state.currentCandidate;
      }
    },
    nextQuestion: (state) => {
      if (!state.currentCandidate) return;
      state.currentCandidate.currentQuestionIndex += 1;
      state.currentQuestion = null;
    },
    finishInterview: (state, action: PayloadAction<Candidate>) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        // Update existing candidate with all completed data
        state.candidates[index] = { ...action.payload };
      } else {
        // Add candidate if not found (fallback)
        state.candidates.push(action.payload);
      }
      console.log('Candidate saved to Redux:', action.payload.name, 'Total candidates:', state.candidates.length);
      state.currentCandidate = null;
      state.currentQuestion = null;
      state.currentMode = 'landing';
      state.interviewStep = 'form';
    },
    incrementQuestionSetIndex: (state) => {
      state.questionSetIndex += 1;
    },
  },
});

export const {
  setCurrentMode,
  setCurrentCandidate,
  setInterviewStep,
  addCandidate,
  updateCandidate,
  setCurrentQuestion,
  setTimerActive,
  setTimeRemaining,
  setExtractedData,
  submitAnswer,
  nextQuestion,
  finishInterview,
  incrementQuestionSetIndex,
} = interviewSlice.actions;

export default interviewSlice.reducer;
