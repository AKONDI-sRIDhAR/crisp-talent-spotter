import { InterviewQuestion } from '../store/interviewStore';

const staticQuestions: Record<'easy' | 'medium' | 'hard', Omit<InterviewQuestion, 'id'>[]> = {
  easy: [
    {
      question: "What is the difference between `let` and `const` in JavaScript?",
      options: [
        "A) `let` is function-scoped, `const` is block-scoped.",
        "B) `let` can be reassigned, `const` cannot.",
        "C) `const` is for constants, `let` is for variables.",
        "D) There is no difference."
      ],
      difficulty: 'easy',
      timeLimit: 20
    },
    {
      question: "In React, what is the purpose of a 'key' prop when rendering a list of elements?",
      options: [
        "A) It is a unique identifier for the element in the DOM.",
        "B) It helps React identify which items have changed, are added, or are removed.",
        "C) It is used for styling purposes.",
        "D) It sets the database key for the data."
      ],
      difficulty: 'easy',
      timeLimit: 20
    },
    {
      question: "What does the 'typeof' operator do in JavaScript?",
      options: [
        "A) It returns the data type of a variable.",
        "B) It checks if a variable is defined.",
        "C) It converts a variable to a string.",
        "D) It returns the size of a variable in memory."
      ],
      difficulty: 'easy',
      timeLimit: 20
    },
  ],
  medium: [
    {
      question: "What is the event loop in Node.js and how does it work?",
      options: [
        "A) It's a loop that iterates over all event listeners.",
        "B) It's a mechanism that allows Node.js to perform non-blocking I/O operations.",
        "C) It's a feature for creating custom events.",
        "D) It's a debugging tool for event-driven applications."
      ],
      difficulty: 'medium',
      timeLimit: 60
    },
    {
      question: "Explain the concept of 'prop drilling' in React and how to avoid it.",
      options: [
        "A) It's a performance optimization technique.",
        "B) It's the process of passing props down multiple levels of components; can be avoided with Context API or state management libraries.",
        "C) It's a way to dynamically generate props.",
        "D) It's an anti-pattern for handling events."
      ],
      difficulty: 'medium',
      timeLimit: 60
    },
    {
      question: "What is the difference between `Promise.all` and `Promise.race`?",
      options: [
        "A) `Promise.all` resolves when all promises resolve, `Promise.race` resolves when the first promise resolves or rejects.",
        "B) `Promise.all` is for arrays of promises, `Promise.race` is for single promises.",
        "C) `Promise.race` is faster than `Promise.all`.",
        "D) They are the same."
      ],
      difficulty: 'medium',
      timeLimit: 60
    },
  ],
  hard: [
    {
      question: "How would you handle authentication and authorization in a Node.js application?",
      options: [
        "A) Using sessions and cookies.",
        "B) Using JSON Web Tokens (JWT).",
        "C) Using a third-party service like Auth0 or Passport.js.",
        "D) All of the above are valid approaches."
      ],
      difficulty: 'hard',
      timeLimit: 120
    },
    {
      question: "Describe how you would optimize a slow-performing React application.",
      options: [
        "A) By using `React.memo`, `useCallback`, and `useMemo` to prevent unnecessary re-renders.",
        "B) By implementing code-splitting and lazy loading for components and routes.",
        "C) By virtualizing long lists to only render visible items.",
        "D) All of the above."
      ],
      difficulty: 'hard',
      timeLimit: 120
    },
    {
        question: "What is server-side rendering (SSR) in the context of a React application, and what are its benefits?",
        options: [
          "A) Rendering components on the server before sending them to the client, which improves performance and SEO.",
          "B) A technique for styling components on the server.",
          "C) A method for pre-loading data on the server.",
          "D) An alternative to using a virtual DOM."
        ],
        difficulty: 'hard',
        timeLimit: 120
      },
  ],
};

export const getStaticQuestion = (difficulty: 'easy' | 'medium' | 'hard', previousQuestions: string[]): InterviewQuestion => {
    const availableQuestions = staticQuestions[difficulty].filter(q => !previousQuestions.includes(q.question));

    if (availableQuestions.length === 0) {
      // Fallback if all questions of a difficulty have been used
      return {
        id: `fallback_${difficulty}_${Date.now()}`,
        question: `What is a key concept in ${difficulty} level web development?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        difficulty,
        timeLimit: staticQuestions[difficulty][0].timeLimit,
      };
    }

    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    return {
      ...question,
      id: `static_${difficulty}_${Date.now()}`,
    };
  };