# Ghostwriter

A sleek, modern AI-powered script writing tool for content creators, prioritizing a local-first approach.

## Features

- **Markdown Editor:** Robust editing with CodeMirror and live preview (`marked`).
- **Organization:** Categorize scripts (YouTube, TikTok, etc.) and capture quick thoughts in an "Ideas" section.
- **AI Assistance:** Integrated OpenRouter support for inline editing, model selection, custom prompts, and context documents.
- **Local Storage:** All data stored securely in a local SQLite database (`better-sqlite3`).

## Development

- **Stack:** Electron, Vite, TypeScript, React, Tailwind CSS, CodeMirror, `better-sqlite3`.
- **AI:** OpenRouter API

### Getting Started

1.  Clone the repository: `git clone <repository_url>`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm start`
4.  **Configure API Key:** Once the app is running, add your OpenRouter API key in the application's settings interface.

### Building

- Package the app: `npm run package`
- Create distributable: `npm run make`

## License

MIT