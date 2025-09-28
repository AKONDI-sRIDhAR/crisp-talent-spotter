import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewStore';

const API_KEY = 'AIzaSyCgbyLeYVkhGNLjCUQwv3SPLaZbMPYOxaY';
const genAI = new GoogleGenerativeAI(API_KEY);

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async extractResumeData(resumeText: string) {
    const prompt = `
      Extract the following information from this resume text. Return ONLY a JSON object with these exact keys:
      - name: candidate's full name
      - email: email address
      - phone: phone number
      
      If any field is not found, use null as the value.
      
      Resume text:
      ${resumeText}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { name: null, email: null, phone: null };
    } catch (error) {
      console.error('Error extracting resume data:', error);
      return { name: null, email: null, phone: null };
    }
  }

  async generateQuestion(difficulty: 'easy' | 'medium' | 'hard', previousQuestions: string[] = []): Promise<InterviewQuestion & { options: string[] }> {
    const timeMap = {
      easy: 20,
      medium: 60,
      hard: 120
    };

    const difficultyContext = {
      easy: 'basic concepts, simple coding problems, or fundamental knowledge',
      medium: 'intermediate concepts, moderate coding challenges, or problem-solving scenarios',
      hard: 'advanced concepts, complex algorithms, system design, or challenging technical problems'
    };

    const previousQuestionsText = previousQuestions.length > 0 
      ? `\n\nPrevious questions asked (do not repeat these):\n${previousQuestions.join('\n')}`
      : '';

    const prompt = `
      Generate a ${difficulty} level MULTIPLE CHOICE interview question for a Full Stack Developer position (React/Node.js).
      
      The question should focus on ${difficultyContext[difficulty]}.
      
      Requirements:
      - Be specific and technical
      - Be appropriate for a ${difficulty} level candidate
      - Focus on practical knowledge and problem-solving
      - Include exactly 4 multiple choice options (A, B, C, D)
      - Only ONE option should be correct
      - Should be answerable in ${timeMap[difficulty]} seconds
      
      ${previousQuestionsText}
      
      Return your response in this exact JSON format:
      {
        "question": "[The question text]",
        "options": ["A) [Option A]", "B) [Option B]", "C) [Option C]", "D) [Option D]"]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: parsed.question,
          difficulty,
          timeLimit: timeMap[difficulty],
          options: parsed.options
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback MCQ questions
      const fallbackQuestions = {
        easy: {
          question: "Which of the following is the correct way to declare a constant in JavaScript?",
          options: ["A) var x = 5;", "B) let x = 5;", "C) const x = 5;", "D) constant x = 5;"]
        },
        medium: {
          question: "What is the primary purpose of React hooks?",
          options: ["A) To manage component styling", "B) To enable state and lifecycle features in functional components", "C) To handle API requests", "D) To optimize performance"]
        },
        hard: {
          question: "Which pattern is most suitable for handling real-time data synchronization in a distributed system?",
          options: ["A) Event Sourcing", "B) CQRS", "C) Event-driven architecture with message queues", "D) All of the above"]
        }
      };
      
      return {
        id: `fallback_${Date.now()}`,
        question: fallbackQuestions[difficulty].question,
        difficulty,
        timeLimit: timeMap[difficulty],
        options: fallbackQuestions[difficulty].options
      };
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<{ score: number; comment: string }> {
    const prompt = `
      Score this interview answer on a scale of 0-10 and provide a brief constructive comment.
      
      Question (${difficulty} level): ${question}
      
      Answer: ${answer}
      
      Scoring criteria:
      - Technical accuracy (40%)
      - Completeness of answer (30%)
      - Communication clarity (20%)
      - Practical understanding (10%)
      
      Consider this is a ${difficulty} level question, so adjust expectations accordingly.
      
      Return your response in this exact JSON format:
      {
        "score": [number between 0-10],
        "comment": "[brief constructive feedback in 1-2 sentences]"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
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
      
      return { score: 5, comment: 'Unable to evaluate answer properly.' };
    } catch (error) {
      console.error('Error scoring answer:', error);
      return { score: 5, comment: 'Error occurred during scoring.' };
    }
  }

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string): Promise<{ summary: string; overallScore: number }> {
    const totalScore = answers.reduce((sum, answer) => sum + answer.aiScore, 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;
    
    const answersText = answers.map((answer, index) => 
      `Question ${index + 1} (${answer.difficulty}): ${answer.question}\nAnswer: ${answer.answer}\nScore: ${answer.aiScore}/10\n`
    ).join('\n');

    const prompt = `
      Generate a comprehensive interview summary for candidate ${candidateName}.
      
      Interview Performance:
      ${answersText}
      
      Average Score: ${averageScore.toFixed(1)}/10
      
      Please provide:
      1. Overall performance assessment
      2. Key strengths demonstrated
      3. Areas for improvement
      4. Recommendation (Strong Hire/Hire/Maybe/No Hire)
      
      Keep the summary professional, constructive, and concise (3-4 sentences).
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      return {
        summary,
        overallScore: Math.round(averageScore * 10) / 10
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: `${candidateName} completed the interview with an average score of ${averageScore.toFixed(1)}/10. Further evaluation recommended.`,
        overallScore: averageScore
      };
    }
  }
}

export const aiService = new AIService();