🤖 CRISP Talent Spotter: AI Technical Interview Platform
CRISP (Candidate Research & Intelligent Screening Platform) is a modern web application designed to revolutionize the technical hiring process. It provides a highly dynamic and secure interview environment, using Google's Gemini API to generate real-time, adaptive technical questions and provide objective, detailed candidate scoring.

This project was built using React, TypeScript, and Tailwind CSS, following modern web development best practices.

🚀 Live Demo
Experience the platform live on Vercel:

https://crisp-talent-spotter.vercel.app/

✨ Features
Candidate (Interviewee) Mode
Dynamic AI Questions: Generates unique, progressive questions for Easy, Medium, and Hard difficulty levels.

Secure Environment: Implements security checks (fullscreen enforcement, focus loss detection) to ensure interview integrity.

Real-Time Timer: Each question has a time limit (20s, 60s, or 120s) tracked with a dynamic UI timer.

State Persistence: Uses Redux Persist to save the session, allowing candidates to resume unfinished interviews.

Interviewer (Recruiter) Dashboard
Login Protection: Simple root/root login for dashboard access.

Candidate Management: View all past and in-progress interviews.

Detailed Analytics: Access question-by-question responses, AI-generated scores (0-10), and personalized AI summary reports for every completed candidate.

🛠️ Technology Stack
Frontend: React with TypeScript

Styling: Tailwind CSS & shadcn/ui

Animation: Framer Motion and GSAP for fluid UI/scrambled text effects.

State Management: Redux Toolkit and Redux Persist

AI Integration: Google's Gemini API for question generation, scoring, and final summary creation.

Bundler: Vite

💻 Local Development
Follow these steps to set up the project locally:

Prerequisites
You must have Node.js (v18+) and npm installed.

# Clone the repository (replace <YOUR_GIT_URL> with the actual link)
git clone <YOUR_GIT_URL>

# Navigate into the project directory
cd crisp-talent-spotter

# Install dependencies
npm install 

Running the Application
Set the API Key:
The AI service relies on the Gemini API. You will need to set your API key in the Redux store's initial state (in src/store/interviewSlice.ts).

Start the Development Server:

npm run dev

The application will be available at http://127.0.0.1:8080/ (or the address shown in your terminal).

Interviewer Credentials (Demo)
To access the private dashboard locally:

Role

Username

Password

Interviewer

root

root

🚢 Deployment
This project is configured for seamless deployment using services that integrate directly with Git.

Vercel Deployment (Current Host)
The easiest method is using Vercel's automated workflow:

Push your final changes to the main branch of your GitHub repository.

Log in to Vercel and import your project from Git.

Vercel automatically detects the Vite setup, runs the build command (npm run build), and serves the static files from the generated /dist directory.

Build Output
To manually inspect the production build output:

npm run build
# The optimized files are placed in the 'dist' directory.

🤝 Contributing
We welcome contributions! If you have suggestions for new features, optimizations, or bug fixes, please submit a pull request or open an issue on the repository.
