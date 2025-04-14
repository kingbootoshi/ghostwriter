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
    createdAt TEXT NOT NULL
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
  },
  {
    name: 'Ideas'
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
  }
];