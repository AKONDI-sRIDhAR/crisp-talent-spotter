import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewSlice';

// --- Local Fallback Implementation ---
/**
 * Fallback implementation for getStaticQuestion.
 * This is a necessary local implementation to resolve the "Failed to resolve import" error.
 */
const getStaticQuestion = (
  difficulty: 'easy' | 'medium' | 'hard',
  previousQuestions: string[]
): InterviewQuestion => {
  const timeMap = { easy: 20, medium: 60, hard: 120 };
  
  const fallbacks: Record<'easy' | 'medium' | 'hard', InterviewQuestion[]> = {
    easy: [
      {
        id: `fb_e1`,
        difficulty: 'easy',
        question: 'What does `useState` return in React?',
        options: ['A value and a function', 'An object', 'An array', 'A string'],
        timeLimit: timeMap.easy
      },
      {
        id: `fb_e2`,
        difficulty: 'easy',
        question: 'Which HTTP method is typically idempotent?',
        options: ['POST', 'PUT', 'DELETE', 'GET'],
        timeLimit: timeMap.easy
      },
      {
        id: `fb_e3`,
        difficulty: 'easy',
        question: 'In JavaScript, what is the purpose of `event.preventDefault()`?',
        options: ['Stops event bubbling', 'Prevents the default browser action', 'Cancels the function call', 'Pauses script execution'],
        timeLimit: timeMap.easy
      },
    ],
    medium: [
      {
        id: `fb_m1`,
        difficulty: 'medium',
        question: 'Explain the concept of prop drilling in React and how to avoid it.',
        options: ['Using Context API', 'Using state lifting', 'Using Redux', 'All of the above'],
        timeLimit: timeMap.medium
      },
      {
        id: `fb_m2`,
        difficulty: 'medium',
        question: 'What is a closure in JavaScript?',
        options: ['A scope wrapper', 'A function having access to its parent scope even after the parent function has closed', 'An alternative to `this` keyword', 'A type of promise'],
        timeLimit: timeMap.medium
      },
      {
        id: `fb_m3`,
        difficulty: 'medium',
        question: 'How do you ensure a Node.js process does not block the event loop?',
        options: ['Use synchronous I/O', 'Avoid CPU-intensive synchronous operations', 'Increase the number of threads', 'Decrease the heap size'],
        timeLimit: timeMap.medium
      },
    ],
    hard: [
      {
        id: `fb_h1`,
        difficulty: 'hard',
        question: 'Describe the Node.js event loop architecture and its phases.',
        options: ['Timers, Pending Callbacks, Poll, Check, Close Callbacks', 'Timers, Poll, Check, Close', 'Call Stack, Message Queue, Event Loop', 'Input/Output, Timers, Check'],
        timeLimit: timeMap.hard
      },
      {
        id: `fb_h2`,
        difficulty: 'hard',
        question: 'What are the trade-offs between monolithic and microservice architectures?',
        options: ['Deployment speed vs. codebase size', 'Scalability vs. latency', 'Simplicity vs. operational complexity', 'Data consistency vs. fault tolerance'],
        timeLimit: timeMap.hard
      },
      {
        id: `fb_h3`,
        difficulty: 'hard',
        question: 'How would you implement Server-Side Rendering (SSR) in a React/Node.js application?',
        options: ['Using the `renderToString` method', 'Using Web Workers', 'By replacing React with Vue', 'By using the browser\'s history API'],
        timeLimit: timeMap.hard
      },
    ],
  };

  const availableQuestions = fallbacks[difficulty].filter(
    q => !previousQuestions.includes(q.question)
  );

  let selectedQuestion;

  if (availableQuestions.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    selectedQuestion = availableQuestions[randomIndex];
  } else {
    // Fallback if all questions have been asked
    const allQuestions = fallbacks[difficulty];
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    selectedQuestion = allQuestions[randomIndex];
  }
  
  // Ensure the question ID is unique each time it's returned
  return {
    ...selectedQuestion,
    id: `fb_${selectedQuestion.id}_${Date.now()}`,
    question: selectedQuestion.question,
  };
};
// ------------------------------------

export class AIService {
  
  // Method to instantiate the model for a specific API key (Argument-based model management)
  private getModel(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // --- Resume Extraction ---
  async extractResumeData(resumeText: string, apiKey: string) {
    // RESOLUTION: Unified API key check
    if (!apiKey) return { name: null, email: null, phone: null, summary: null };
    if (!resumeText) return { name: null, email: null, phone: null, summary: null };

    const prompt = `
      Extract the following information from this resume text. Return ONLY a JSON object with these exact keys:
      - name: candidate's full name
      - email: email address
      - phone: phone number
      - summary: A concise 2-3 sentence summary of the candidate's professional experience and skills.
      
      If any field is not found, use null as the value.
      
      Resume text:
      ${resumeText}
    `;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('AI could not extract resume data into a valid JSON.');
      return { name: null, email: null, phone: null, summary: null };
    } catch (error) {
      console.error('Error extracting resume data:', error);
      return { name: null, email: null, phone: null, summary: null };
    }
  }

  // --- Question Generation ---
  async generateQuestion(
    difficulty: 'easy' | 'medium' | 'hard',
    previousQuestions: string[],
    apiKey: string | null | undefined
  ): Promise<InterviewQuestion> {
    const timeMap = { easy: 20, medium: 60, hard: 120 };

    // Fallback if no API key is provided
    if (!apiKey) {
      return getStaticQuestion(difficulty, previousQuestions);
    }

    const difficultyContext = {
      easy: 'basic concepts, simple coding problems, or fundamental knowledge',
      medium: 'intermediate concepts, moderate coding challenges, or problem-solving scenarios',
      hard: 'advanced concepts, complex algorithms, system design, or challenging technical problems'
    };

    const previousQuestionsText = previousQuestions.length > 0
      ? `\n\nCRITICAL: Do NOT repeat any of these previous questions:\n- ${previousQuestions.join('\n- ')}`
      : '';

    // Merged prompt for dynamic question generation
    const prompt = `
      You are an AI interviewer for a Full Stack Developer position (React/Node.js).
      Generate a single, unique, ${difficulty} level MULTIPLE CHOICE interview question.
      The question should test the candidate's knowledge of ${difficultyContext[difficulty]}.
      
      Requirements:
      - The question must be specific, technical, and distinct from common examples.
      - Provide exactly 4 multiple choice options.
      - Only ONE option can be correct.
      ${previousQuestionsText}

      Return your response as a single, clean JSON object. Do not include any other text, markdown, or explanations.

      The object MUST have this exact format:
      {
        "question": "[The question text]",
        "options": ["A) [Option A]", "B) [Option B]", "C) [Option C]", "D) [Option D]"]
      }

      To ensure variety for different users, use this unique seed in your generation process: ${Date.now()}-${Math.random()}
    `;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const cleanQuestion = parsed.question.replace(/\*\*/g, '');
        return {
          id: `q_${Date.now()}`,
          question: cleanQuestion,
          difficulty,
          timeLimit: timeMap[difficulty],
          options: parsed.options
        };
      }
      throw new Error('Invalid or incomplete response format from AI for question generation.');
    } catch (error) {
      console.error('Error generating dynamic question, falling back to static:', error);
      // Fallback to static question list when AI call fails
      return getStaticQuestion(difficulty, previousQuestions);
    }
  }

  // --- Answer Scoring ---
  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard', apiKey: string): Promise<{ score: number; comment: string }> {
    if (!apiKey) {
      return { score: 0, comment: 'AI scoring is disabled. Please set an API key.' };
    }

    const prompt = `
      As an AI hiring assistant, evaluate the following answer to an interview question.
      
      **Question (${difficulty} level):**
      ${question}
      
      **Candidate's Answer:**
      "${answer}"
      
      **Instructions:**
      1.  **Score:** Provide a score from 0 to 10 based on technical accuracy, clarity, and completeness. A score of 0 should be given for completely incorrect, irrelevant, or empty answers.
      2.  **Comment:** Write a brief, constructive comment (1-2 sentences) explaining the reason for the score.
      
      **CRITICAL:** Return your response as a single, clean JSON object. Do not include any other text, markdown, or explanations.
      
      **JSON Format:**
      {
        "score": [number between 0-10],
        "comment": "[Your brief, constructive feedback]"
      }
    `;

    // Implemented retry mechanism for increased scoring reliability
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const model = this.getModel(apiKey);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return {
                score: Math.max(0, Math.min(10, parsed.score || 0)),
                comment: parsed.comment || 'No comment provided.'
              };
            }
            // If parsing fails, throw to trigger the catch/retry block.
            throw new Error("Failed to parse JSON from AI response.");
        } catch (error) {
            console.error(`Error scoring answer on attempt ${attempt}:`, error);
            if (attempt === 2) {
                // If the second attempt also fails, return an error.
                return { score: 0, comment: 'An error occurred during AI scoring after multiple attempts.' };
            }
            // Optional: wait a moment before retrying
            await new Promise(res => setTimeout(res, 500));
        }
    }

    // Should not be reached, but as a final fallback.
    return { score: 0, comment: 'An unexpected error occurred in the scoring service.' };
  }

  // --- Final Summary Generation ---
  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string, resumeSummary: string | null, apiKey: string): Promise<{ summary: string; overallScore: number }> {
    // Safely calculate total score, accounting for potentially missing scores
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;
    const overallScore = Math.round(averageScore * 10) / 10;

    if (!apiKey) {
      return {
        summary: 'AI summary is disabled. Please set an API key to enable this feature.',
        overallScore: 0
      };
    }
    
    const answersText = answers.map((answer, index) => 
      `Question ${index + 1} (${answer.difficulty}): ${answer.question}\nAnswer: ${answer.answer}\nScore: ${answer.aiScore}/10\n`
    ).join('\n');

    const resumeContext = resumeSummary
      ? `\n**Candidate's Resume Summary:**\n${resumeSummary}\n`
      : '';

    // Merged prompt for a robust, concise summary
    const prompt = `
      As an AI hiring assistant, generate a professional interview summary for a candidate named ${candidateName}.
      The summary should be concise (3-4 sentences) and cover the following points based on the provided interview data and resume summary:
      1.  An overall assessment of the candidate's performance, considering both their interview answers and resume.
      2.  Mention one key strength, drawing from either the interview or resume.
      3.  Mention one area for improvement based on the interview.
      4.  Provide a final hiring recommendation (e.g., "Strong Hire", "Good Candidate", "Needs Improvement").

      ${resumeContext}
      **Interview Performance:**
      ${answersText}
      
      Return ONLY the summary text. Do not use markdown or JSON formatting.
    `;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      if (!summary) {
          throw new Error("AI returned an empty summary.");
      }

      return {
        summary,
        overallScore: Math.round(averageScore * 10) / 10
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: `${candidateName} completed the interview. The AI summary could not be generated due to an error.`,
        overallScore: averageScore
      };
    }
  }
}

export const aiService = new AIService();