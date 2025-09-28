# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/71eba802-79cb-48dc-a2b3-28976bde6342

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/71eba802-79cb-48dc-a2b3-28976bde6342) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Configuration

To enable the AI-powered features (dynamic question generation, resume analysis, scoring), you need to provide a Google AI API key.

1.  **Create a `.env` file:** In the root of the project, create a new file named `.env` by copying the example file:
    ```sh
    cp .env.example .env
    ```

2.  **Set the API Key:** Open the `.env` file and replace `"YOUR_API_KEY_HERE"` with your actual Google AI API key.
    ```
    VITE_GOOGLE_AI_API_KEY="your-actual-api-key-goes-here"
    ```

### Deploying to Vercel/Netlify

When deploying your project to a hosting service like Vercel or Netlify, you will need to set the `VITE_GOOGLE_AI_API_KEY` as an environment variable in your project's settings on that platform. Do not expose your `.env` file publicly.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/71eba802-79cb-48dc-a2b3-28976bde6342) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
