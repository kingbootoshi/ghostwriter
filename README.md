# Ghostwriter

A sleek, modern AI-powered script writing tool for content creators.

## Features

- Markdown editor with live preview
- Organize scripts by categories (YouTube, TikTok, etc.)
- Dedicated space for brainstorming video ideas
- AI assistance with OpenRouter integration
- In-line AI editing capabilities
- Local-first approach with SQLite storage

## Development

This is an Electron application with:
- Electron + Vite + TypeScript
- React for UI components
- Tailwind CSS for styling
- CodeMirror for the markdown editor
- better-sqlite3 for local database
- OpenRouter API for AI capabilities

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
4. Start the development server: `npm start`

### Building

- Package the app: `npm run package`
- Create distributable: `npm run make`

## License

MIT