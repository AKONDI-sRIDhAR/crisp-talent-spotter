import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewAnswer, InterviewQuestion } from '../store/interviewStore';

// API Key is hardcoded as requested for immediate deployment.
const API_KEY = "AIzaSyCgbyLeYVkhGNLjCUQwv3SPLaZbMPYOxaY";

// Error handling for missing key during development.
if (!API_KEY) {
  throw new Error("API key is missing. Please ensure it's set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// A helper function to add retry logic to any async AI call.
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Error on attempt ${attempt}:`, error);
            if (attempt === retries) {
                // If all retries fail, re-throw the last error.
                throw error;
            }
            // Optional: wait a moment before retrying.
            await new Promise(res => setTimeout(res, 500));
        }
    }
    // This should not be reached, but satisfies TypeScript.
    throw new Error("Retry logic failed unexpectedly.");
}


export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async extractResumeData(resumeText: string): Promise<{ name: string | null; email: string | null; phone: string | null; }> {
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
        return await withRetry(async () => {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Failed to parse JSON from AI response for resume data.");
        });
    } catch (error) {
        console.error('Error extracting resume data after retries:', error);
        return { name: null, email: null, phone: null };
    }
  }

  async generateQuestion(
    difficulty: 'easy' | 'medium' | 'hard',
    previousQuestions: string[],
    resumeText: string
  ): Promise<InterviewQuestion> {
    const timeMap = { easy: 20, medium: 60, hard: 120 };

    const previousQuestionsText = previousQuestions.length > 0
      ? `\n\nCRITICAL: Do NOT repeat any of these previous questions:\n- ${previousQuestions.join('\n- ')}`
      : '';

    const prompt = `
      You are an AI interviewer for a Full Stack Developer (React/Node.js).
      Your task is to generate a single, unique, ${difficulty} level MULTIPLE CHOICE interview question.
      
      **CRITICAL INSTRUCTIONS:**
      1.  The question MUST be based on the skills, technologies, or experiences mentioned in the following resume text.
      2.  The question must be specific, technical, and distinct from common examples.
      3.  Provide exactly 4 multiple choice options. Only ONE option can be correct.
      ${previousQuestionsText}

      **Resume Text to Base Question On:**
      ---
      ${resumeText}
      ---

      Return your response as a single, clean JSON object. Do not include any other text, markdown, or explanations.
      The object MUST have this exact format: {"question": "[The question text]", "options": ["A) ...", "B) ...", "C) ...", "D) ..."]}
    `;

    try {
        return await withRetry(async () => {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    id: `q_${Date.now()}`,
                    question: parsed.question.replace(/\*\*/g, ''),
                    difficulty,
                    timeLimit: timeMap[difficulty],
                    options: parsed.options
                };
            }
            throw new Error('Invalid JSON response from AI for question generation.');
        });
    } catch (error) {
        console.error('Error generating question after retries:', error);
        return {
            id: `fallback_${difficulty}_${Date.now()}`,
            question: `The AI failed to generate a question based on the resume. Let's try a classic: "What is your favorite ${difficulty} level concept in programming and why?"`,
            options: ['I will explain my favorite concept.', 'I prefer not to answer.', 'I need a moment to think.', 'Let\'s move to the next question.'],
            difficulty,
            timeLimit: timeMap[difficulty],
        };
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<{ score: number; comment: string }> {
    const prompt = `
      As an AI hiring assistant, evaluate the following answer on a scale of 0-10.
      Question (${difficulty}): ${question}
      Answer: "${answer}"
      Instructions: Provide a score (0-10) and a brief, constructive comment (1-2 sentences).
      Return your response in this exact JSON format: {"score": [number], "comment": "[feedback]"}
    `;

    try {
        return await withRetry(async () => {
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
            throw new Error("Failed to parse JSON from AI response for scoring.");
        });
    } catch (error) {
        console.error('Error scoring answer after retries:', error);
        return { score: 0, comment: 'An error occurred during AI scoring after multiple attempts.' };
    }
  }

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string): Promise<{ summary: string; overallScore: number }> {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;
    const answersText = answers.map((a, i) => `Q${i+1}: ${a.question}\nA: ${a.answer}\nScore: ${a.aiScore}/10`).join('\n\n');

    const prompt = `
      As an AI hiring assistant, generate a professional, concise (3-4 sentences) interview summary for ${candidateName}.
      Based on the data below, provide:
      1. Overall performance assessment.
      2. One key strength.
      3. One area for improvement.
      4. A final hiring recommendation (e.g., "Strong Hire", "Good Candidate", "Needs Improvement").
      Interview Data:
      ${answersText}
      Return ONLY the summary text.
    `;

    try {
        return await withRetry(async () => {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text().trim();
            if (!summary) throw new Error("AI returned an empty summary.");
            return {
                summary,
                overallScore: Math.round(averageScore * 10) / 10
            };
        });
    } catch (error) {
        console.error('Error generating summary after retries:', error);
        return {
            summary: `${candidateName} completed the interview. The AI summary could not be generated due to an error.`,
            overallScore: averageScore
        };
    }
  }
}

export const aiService = new AIService();