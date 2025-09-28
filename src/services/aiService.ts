import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewStore';
import { getStaticQuestion } from '../lib/staticQuestions';

export class AIService {
  async extractResumeData(resumeText: string, apiKey: string) {
    if (!apiKey) return { name: null, email: null, phone: null };

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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
    previousQuestions: string[],
    apiKey: string | null | undefined
  ): Promise<InterviewQuestion> {
    // If no API key is provided, or if it's an empty string, fall back to static questions.
    if (!apiKey) {
      return getStaticQuestion(difficulty, previousQuestions);
    }

    const timeMap = {
      easy: 20,
      medium: 60,
      hard: 120,
    };

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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const cleanQuestion = parsed.question.replace(/\*\*/g, '');

        return {
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: cleanQuestion,
          difficulty,
          timeLimit: timeMap[difficulty],
          options: parsed.options
        };
      }
      
      throw new Error('Invalid or incomplete response format from AI');
    } catch (error) {
      console.error('Error generating dynamic question, falling back to static:', error);
      // If the AI call fails (e.g. invalid key), also fall back to static.
      return getStaticQuestion(difficulty, previousQuestions);
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard', apiKey: string): Promise<{ score: number; comment: string }> {
    if (!apiKey) {
      return { score: 0, comment: 'AI scoring is disabled. Please set an API key.' };
    }

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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string, apiKey: string): Promise<{ summary: string; overallScore: number }> {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;

    if (!apiKey) {
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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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