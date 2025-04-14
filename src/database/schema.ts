// Database schema for Ghostwriter application

export const SCHEMA = [
  // Categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`,

  // Scripts table
  `CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    categoryId TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
  )`,

  // Ideas table
  `CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'unrated',
    linkedScriptId TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (linkedScriptId) REFERENCES scripts (id) ON DELETE SET NULL
  )`,
  
  // Idea Tags table
  `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`,
  
  // Idea-Tags join table
  `CREATE TABLE IF NOT EXISTS idea_tags (
    ideaId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (ideaId, tagId),
    FOREIGN KEY (ideaId) REFERENCES ideas (id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
  )`,
  
  // Idea Categories table
  `CREATE TABLE IF NOT EXISTS idea_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )`,

  // Settings table - key-value store
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  // Context documents table
  `CREATE TABLE IF NOT EXISTS contextDocuments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filePath TEXT NOT NULL,
    isEnabled INTEGER NOT NULL DEFAULT 1
  )`
];

// Create default categories
export const DEFAULT_CATEGORIES = [
  {
    name: 'YouTube Scripts'
  },
  {
    name: 'TikTok Scripts'
  }
];

// Default settings
export const DEFAULT_SETTINGS = [
  {
    key: 'selectedModel',
    value: 'anthropic/claude-3.7-sonnet'
  },
  {
    key: 'globalPrompt',
    value: 'You are an expert scriptwriter, helping with content creation for YouTube videos and TikTok shorts. Your goal is to help create engaging, clear, and concise content that captures viewer attention.'
  },
  {
    key: 'apiKey',
    value: ''
  }
];