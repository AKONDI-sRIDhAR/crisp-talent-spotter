import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewStore';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export class AIService {
  private getModel() {
    if (!genAI) {
      console.warn("VITE_GOOGLE_AI_API_KEY is not set. AI features are disabled.");
      return null;
    }
    return genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async extractResumeData(resumeText: string) {
    const model = this.getModel();
    if (!model) return { name: null, email: null, phone: null };

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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
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

  async generateQuestion(
    difficulty: 'easy' | 'medium' | 'hard',
    previousQuestions: string[]
  ): Promise<InterviewQuestion> {
    const model = this.getModel();
    const timeMap = { easy: 20, medium: 60, hard: 120 };

    if (!model) {
      return {
        id: `static_${difficulty}_${Date.now()}`,
        question: `AI is disabled. What is a key concept in ${difficulty} web development?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        difficulty,
        timeLimit: timeMap[difficulty],
      };
    }

    const difficultyContext = {
      easy: 'basic concepts, simple coding problems, or fundamental knowledge',
      medium: 'intermediate concepts, moderate coding challenges, or problem-solving scenarios',
      hard: 'advanced concepts, complex algorithms, system design, or challenging technical problems'
    };

    const previousQuestionsText = previousQuestions.length > 0
      ? `\n\nCRITICAL: Do NOT repeat any of these previous questions:\n- ${previousQuestions.join('\n- ')}`
      : '';

    const prompt = `
      Generate a single ${difficulty} level MULTIPLE CHOICE interview question for a Full Stack Developer position (React/Node.js).
      This question should test the candidate's knowledge of ${difficultyContext[difficulty]}.
      
      Requirements for the question:
      - Be specific, technical, and unique.
      - Include exactly 4 multiple choice options.
      - Only ONE option should be correct.
      ${previousQuestionsText}

      Return your response as a single JSON object. Do not include any other text or markdown in your response.

      The object MUST have this exact format:
      {
        "question": "[The question text]",
        "options": ["A) [Option A]", "B) [Option B]", "C) [Option C]", "D) [Option D]"]
      }

      To ensure variety, use this random seed in your generation process: ${Math.random()}
    `;

    try {
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
      throw new Error('Invalid or incomplete response format from AI');
    } catch (error) {
      console.error('Error generating question:', error);
      return {
        id: `fallback_${difficulty}_${Date.now()}`,
        question: 'An error occurred generating a question. Please discuss your favorite programming concept.',
        options: ['Okay', 'Will do', 'I understand', 'Let\'s proceed'],
        difficulty,
        timeLimit: 30,
      };
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<{ score: number; comment: string }> {
    const model = this.getModel();
    if (!model) return { score: 0, comment: 'AI scoring is disabled. Please set an API key.' };

    const prompt = `
      Score this interview answer on a scale of 0-10 and provide a brief constructive comment.
      Question (${difficulty} level): ${question}
      Answer: ${answer}
      Return your response in this exact JSON format:
      {
        "score": [number between 0-10],
        "comment": "[brief constructive feedback in 1-2 sentences]"
      }
    `;

    try {
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
      return { score: 5, comment: 'Unable to evaluate answer properly.' };
    } catch (error) {
      console.error('Error scoring answer:', error);
      return { score: 5, comment: 'Error occurred during scoring.' };
    }
  }

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string): Promise<{ summary: string; overallScore: number }> {
    const model = this.getModel();
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;

    if (!model) {
      return {
        summary: 'AI summary is disabled. Please set an API key to enable this feature.',
        overallScore: 0
      };
    }
    
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();
      return {
        summary,
        overallScore: Math.round(averageScore * 10) / 10
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: `${candidateName} completed the interview. AI summary failed to generate.`,
        overallScore: averageScore
      };
    }
  }
}

export const aiService = new AIService();