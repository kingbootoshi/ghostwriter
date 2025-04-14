// Type definitions for the Ghostwriter application

// Category types
export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

// Script types
export interface Script {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

// Idea types
export interface Idea {
  id: string;
  content: string;
  status?: 'good' | 'bad' | 'unrated';
  linkedScriptId?: string;
  linkedScript?: Script;
  createdAt: string;
  tags?: Tag[];
  categoryId?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface IdeaCategory {
  id: string;
  name: string;
}

// Settings types
export interface AppSettings {
  selectedModel: string;
  globalPrompt: string;
  apiKey: string;
}

// Context document types
export interface ContextDocument {
  id: string;
  name: string;
  filePath: string;
  isEnabled: boolean;
}

// OpenRouter API types
export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
}

export interface InlineEditRequest {
  selectedText: string;
  context: string;
  instruction: string;
}

export interface InlineEditResponse {
  modifiedText: string;
  reasoning?: string;
}

// API bridges exposed to renderer via contextBridge
export interface DatabaseAPI {
  getCategories: () => Promise<Category[]>;
  createCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  getScripts: (categoryId?: string) => Promise<Script[]>;
  getUncategorizedScripts: () => Promise<Script[]>;
  getScript: (id: string) => Promise<Script>;
  createScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Script>;
  updateScript: (id: string, updates: Partial<Omit<Script, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Script>;
  deleteScript: (id: string) => Promise<boolean>;
  
  getIdeas: () => Promise<Idea[]>;
  createIdea: (content: string) => Promise<Idea>;
  updateIdea: (id: string, updates: Partial<Omit<Idea, 'id' | 'createdAt'>>) => Promise<Idea>;
  deleteIdea: (id: string) => Promise<boolean>;
  setIdeaStatus: (id: string, status: 'good' | 'bad' | 'unrated') => Promise<Idea>;
  linkIdeaToScript: (ideaId: string, scriptId: string) => Promise<Idea>;
  unlinkIdeaFromScript: (ideaId: string) => Promise<Idea>;
  
  // Tag operations
  getTags: () => Promise<Tag[]>;
  createTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<boolean>;
  addTagToIdea: (ideaId: string, tagId: string) => Promise<boolean>;
  removeTagFromIdea: (ideaId: string, tagId: string) => Promise<boolean>;
  getIdeaTags: (ideaId: string) => Promise<Tag[]>;
  
  // Script tag methods
  getScriptTags: (scriptId: string) => Promise<Tag[]>;
  addTagToScript: (scriptId: string, tagId: string) => Promise<boolean>;
  removeTagFromScript: (scriptId: string, tagId: string) => Promise<boolean>;
  
  // Idea Category operations
  getIdeaCategories: () => Promise<IdeaCategory[]>;
  createIdeaCategory: (name: string) => Promise<IdeaCategory>;
  updateIdeaCategory: (id: string, name: string) => Promise<IdeaCategory>;
  deleteIdeaCategory: (id: string) => Promise<boolean>;
  setIdeaCategory: (ideaId: string, categoryId: string) => Promise<Idea>;
  
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  
  getContextDocuments: () => Promise<ContextDocument[]>;
  createContextDocument: (name: string, filePath: string) => Promise<ContextDocument>;
  toggleContextDocument: (id: string, isEnabled: boolean) => Promise<ContextDocument>;
  deleteContextDocument: (id: string) => Promise<boolean>;
}

export interface AIAPI {
  refreshApiKey: () => Promise<boolean>;
  getModels: () => Promise<OpenRouterModel[]>;
  performInlineEdit: (request: InlineEditRequest) => Promise<InlineEditResponse>;
}

// Declare API interface for exposing from preload to renderer
export interface API {
  db: DatabaseAPI;
  ai: AIAPI;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}