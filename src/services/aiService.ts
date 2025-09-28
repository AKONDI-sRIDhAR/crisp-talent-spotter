import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewStore';

// API Key is hardcoded as requested for immediate deployment.
const API_KEY = "AIzaSyCgbyLeYVkhGNLjCUQwv3SPLaZbMPYOxaY";

// Error handling for missing key during development.
if (!API_KEY) {
  throw new Error("API key is missing. Please ensure it's set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async extractResumeData(resumeText: string) {
    if (!resumeText) return { name: null, email: null, phone: null };

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
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('AI could not extract resume data into a valid JSON.');
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
    const timeMap = { easy: 20, medium: 60, hard: 120 };

    const difficultyContext = {
      easy: 'basic concepts, simple coding problems, or fundamental knowledge',
      medium: 'intermediate concepts, moderate coding challenges, or problem-solving scenarios',
      hard: 'advanced concepts, complex algorithms, system design, or challenging technical problems'
    };

    const previousQuestionsText = previousQuestions.length > 0
      ? `\n\nCRITICAL: Do NOT repeat any of these previous questions:\n- ${previousQuestions.join('\n- ')}`
      : '';

    // Added more entropy to ensure unique questions for each session.
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
      const result = await this.model.generateContent(prompt);
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
      console.error('Error generating question:', error);
      // Provide a more user-friendly fallback question.
      return {
        id: `fallback_${difficulty}_${Date.now()}`,
        question: `The AI failed to generate a question. Let's try a classic: "What is your favorite ${difficulty} level concept in programming and why?"`,
        options: ['I will explain my favorite concept.', 'I prefer not to answer.', 'I need a moment to think.', 'Let\'s move to the next question.'],
        difficulty,
        timeLimit: timeMap[difficulty],
      };
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<{ score: number; comment: string }> {
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
      return { score: 0, comment: 'AI was unable to parse the score.' };
    } catch (error) {
      console.error('Error scoring answer:', error);
      return { score: 0, comment: 'An error occurred during AI scoring.' };
    }
  }

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string): Promise<{ summary: string; overallScore: number }> {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;

    const answersText = answers.map((answer, index) => 
      `Question ${index + 1} (${answer.difficulty}): ${answer.question}\nAnswer: ${answer.answer}\nScore: ${answer.aiScore}/10\n`
    ).join('\n');

    // A more robust prompt for summary generation.
    const prompt = `
      As an AI hiring assistant, generate a professional interview summary for a candidate named ${candidateName}.
      The summary should be concise (3-4 sentences) and cover the following points based on the provided interview data:
      1.  An overall assessment of the candidate's performance.
      2.  Mention one key strength.
      3.  Mention one area for improvement.
      4.  Provide a final hiring recommendation (e.g., "Strong Hire", "Good Candidate", "Needs Improvement").

      Here is the interview data:
      ${answersText}
      
      Return ONLY the summary text. Do not use markdown or JSON formatting.
    `;

    try {
      const result = await this.model.generateContent(prompt);
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