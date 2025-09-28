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

    // Implement a retry mechanism for scoring.
    for (let attempt = 1; attempt <= 2; attempt++) {
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
            // If parsing fails, it will throw and trigger the catch block for a retry.
            throw new Error("Failed to parse JSON from AI response.");
        } catch (error) {
            console.error(`Error scoring answer on attempt ${attempt}:`, error);
            if (attempt === 2) {
                // If the second attempt also fails, return an error.
                return { score: 0, comment: 'An error occurred during AI scoring after multiple attempts.' };
            }
            // Optional: wait a moment before retrying.
            await new Promise(res => setTimeout(res, 500));
        }
    }

    // This should not be reached, but as a fallback.
    return { score: 0, comment: 'An unexpected error occurred in the scoring service.' };
  }

  async generateFinalSummary(answers: InterviewAnswer[], candidateName: string): Promise<{ summary: string; overallScore: number }> {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiScore || 0), 0);
    const averageScore = answers.length > 0 ? totalScore / answers.length : 0;

    const answersText = answers.map((answer, index) => 
      `Question ${index + 1} (${answer.difficulty}): ${answer.question}\nAnswer: ${answer.answer}\nScore: ${answer.aiScore}/10\n`
    ).join('\n');

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