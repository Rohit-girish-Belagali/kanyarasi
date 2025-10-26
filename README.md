# Mood.ai - Intelligent Multilingual Voice Companion

Mood.ai is an intelligent, multilingual emotional companion and productivity assistant that interacts naturally through both voice and text. It uses Google's Gemini AI for conversational intelligence and ElevenLabs for high-quality, natural-sounding voice synthesis in multiple languages.

## Features

- 🎤 **Voice & Text Interaction**: Seamless voice-to-text input and text-to-speech output
- 🌍 **Multilingual Support**: Auto-detects and responds in the user's language
- 🧠 **Dual Modes**:
  - **Emotional Support Mode**: Empathetic companion for emotional well-being
  - **Secretary Mode**: Proactive digital assistant for tasks, schedules, and goals
- 🗣️ **Natural Voice**: High-quality voice synthesis powered by ElevenLabs
- 📅 **Calendar Integration**: Manage tasks, events, and schedules
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Wouter
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini 2.0 Flash
- **Voice**: ElevenLabs Text-to-Speech API
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite, TSX

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Rohit-girish-Belagali/kanyarasi.git
cd kanyarasi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory of the project:

```bash
touch .env
```

Add the following environment variables to your `.env` file:

```env
# Google Gemini API Key
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSyCViQef6EDbOJEvaetIOTh6eoOfIM5uuYA"

# ElevenLabs API Key
# Get your API key from: https://elevenlabs.io/app/settings/api-keys
# an api key is provided and shld work but if facing any trouble enter a new api key
ELEVENLABS_API_KEY="9097e483eca4f09ba180332f7d06bcac5014defc7ac980efb4247211597485aa"
```

**Important Notes:**
- **Never commit the `.env` file to Git** - it's already included in `.gitignore`

### 4. How to Get API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key
5. Paste it into your `.env` file as `GEMINI_API_KEY`

#### ElevenLabs API Key
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in to your account
3. Go to [Settings > API Keys](https://elevenlabs.io/app/settings/api-keys)
4. Click "Create API Key" or copy your existing key
5. Paste it into your `.env` file as `ELEVENLABS_API_KEY`

**Note**: ElevenLabs offers a free tier with limited characters per month. For production use, consider upgrading to a paid plan.

### 5. Run the Development Server
run this first if using windows
npm install --save-dev cross-env

then in the package.json under scripts, dev must be changed to this
"dev": "cross-env NODE_ENV=development tsx server/index.ts"
after that run the server
```bash
npm run dev
```
The application will start on **http://localhost:5001**

Open your browser and navigate to the URL to start using Mood.ai!

## Usage

### Voice Mode
1. Click the microphone button to enter voice mode
2. Tap the circular button to start speaking
3. Speak your message in any language
4. The AI will respond with text and voice in the same language

### Text Mode
1. Type your message in the input field
2. Click the send button or press Enter
3. The AI will respond with text and voice

### Switching Modes
- The AI automatically detects whether you need emotional support or productivity assistance
- You can also manually switch between modes in the settings

## Project Structure

```
GeminiVoiceFlow/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── public/          # Static assets
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── gemini.ts        # Gemini AI integration
│   ├── elevenlabs.ts    # ElevenLabs TTS integration
│   └── storage.ts       # Database logic
├── shared/              # Shared types and schemas
└── .env                 # Environment variables (create this)
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Troubleshooting

### Port Already in Use
If you see an error like `EADDRINUSE: address already in use`, another process is using port 5001. You can:
1. Stop the other process
2. Or change the port in `server/index.ts`

### API Key Errors
If you see "Failed to get response" or "Speech synthesis failed":
1. Verify your API keys are correct in the `.env` file
2. Ensure there are no extra spaces or quotes around the keys
3. Check that your API keys are active and have sufficient quota

### Module Not Found Errors
If you encounter module errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- **Google Gemini** for conversational AI
- **ElevenLabs** for natural voice synthesis
- **shadcn/ui** for beautiful UI components
- **Replit** for development infrastructure

---

Built with ❤️ by the Mood.ai team
