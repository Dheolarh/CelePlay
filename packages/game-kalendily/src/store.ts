import { create } from 'zustand';

export interface KalendilyQuestion {
  id: string;
  text: string;
  answerText: string;
  explanation: string;
  day: number;
  month: number; // 0-11
  year: number;
  imageUrl: string;
}

interface KalendilyState {
  questions: KalendilyQuestion[];
  currentQuestionIndex: number;
  score: number;
  timeLeft: number; // 15 mins total normally, or calculated
  
  gameState: 'idle' | 'playing' | 'flashing' | 'answering' | 'ended';
  selectedDay: number | null;
  correctDay: number | null;

  initializeGame: (questions: KalendilyQuestion[]) => void;
  submitAnswer: (day: number) => void;
  showAnswer: () => void;
  nextQuestion: () => void;
  tickTimer: () => void;
  resetGame: () => void;
}

export const useKalendilyStore = create<KalendilyState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  timeLeft: 90, // default 90 seconds for 10 questions
  
  gameState: 'idle',
  selectedDay: null,
  correctDay: null,

  initializeGame: (questions) => {
    // Total time = 9 seconds per question (100 = 900s = 15m)
    const initialTime = questions.length * 9;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    
    set({
      questions: shuffled,
      currentQuestionIndex: 0,
      score: 0,
      timeLeft: initialTime,
      gameState: 'playing',
      selectedDay: null,
      correctDay: null
    });
  },

  submitAnswer: (day) => {
    const { questions, currentQuestionIndex, gameState } = get();
    if (gameState !== 'playing') return;

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = day === currentQ.day;

    set({
      selectedDay: day,
      correctDay: currentQ.day,
      gameState: 'flashing',
      score: get().score + (isCorrect ? 1 : 0)
    });
  },

  showAnswer: () => {
    set({ gameState: 'answering' });
  },

  nextQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    if (currentQuestionIndex >= questions.length - 1) {
      set({ gameState: 'ended' });
    } else {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        gameState: 'playing',
        selectedDay: null,
        correctDay: null
      });
    }
  },

  tickTimer: () => {
    const { timeLeft, gameState } = get();
    if (gameState === 'playing' && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
      if (timeLeft - 1 === 0) {
        set({ gameState: 'ended' });
      }
    }
  },

  resetGame: () => {
    set({
      questions: [],
      currentQuestionIndex: 0,
      score: 0,
      timeLeft: 0,
      gameState: 'idle',
      selectedDay: null,
      correctDay: null
    });
  }
}));
