import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SCHEMA, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './schema';
import { 
  Category, 
  Script, 
  Idea, 
  AppSettings, 
  ContextDocument 
} from '../types';

// Database class
class DatabaseService {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'ghostwriter.db');
    this.db = new Database(dbPath);
    
    // For better performance
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Initialize the database with schema and default data
   */
  public initialize(): void {
    if (this.initialized) return;

    // Create tables
    SCHEMA.forEach(statement => {
      this.db.prepare(statement).run();
    });

    // Run migrations
    this.runMigrations();

    // Check if categories table is empty and insert defaults if needed
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (categoryCount.count === 0) {
      const insertCategory = this.db.prepare('INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)');
      
      DEFAULT_CATEGORIES.forEach(category => {
        insertCategory.run(uuidv4(), category.name, new Date().toISOString());
      });
    }

    // Check if settings table is empty and insert defaults if needed
    const settingsCount = this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (settingsCount.count === 0) {
      const insertSetting = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      
      DEFAULT_SETTINGS.forEach(setting => {
        insertSetting.run(setting.key, setting.value);
      });
    }

    this.initialized = true;
  }

  /**
   * Run migrations to update database schema
   */
  private runMigrations(): void {
    // Check database version and run appropriate migrations
    try {
      // Check if migrations table exists
      const migrationsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").get();
      
      if (!migrationsExists) {
        // Create migrations table
        this.db.prepare('CREATE TABLE migrations (version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL)').run();
      }
      
      // Get current version
      const currentVersion = this.db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
      const version = currentVersion.version || 0;
      
      // Run migrations based on current version
      if (version < 1) {
        console.log('Running migration to version 1...');
        this.migrateToV1();
        this.db.prepare('INSERT INTO migrations (version, appliedAt) VALUES (?, ?)').run(1, new Date().toISOString());
      }

      // Future migrations would go here
      // if (version < 2) { ... }
      
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  }

  /**
   * Migrate database to version 1
   * - Add status and linkedScriptId columns to ideas table
   * - Create tags and idea_tags tables
   */
  private migrateToV1(): void {
    const transaction = this.db.transaction(() => {
      // Check if ideas table exists
      const ideasExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ideas'").get();
      
      if (ideasExists) {
        // Check if ideas table needs to be rebuilt with the new schema
        try {
          // Check if status column exists in ideas table
          const hasStatusColumn = this.db.prepare("PRAGMA table_info(ideas)").all()
            .some((col: any) => col.name === 'status');
          
          if (!hasStatusColumn) {
            // Add status column to ideas table
            this.db.prepare('ALTER TABLE ideas ADD COLUMN status TEXT DEFAULT "unrated"').run();
          }
          
          // Check if linkedScriptId column exists in ideas table
          const hasLinkedScriptIdColumn = this.db.prepare("PRAGMA table_info(ideas)").all()
            .some((col: any) => col.name === 'linkedScriptId');
          
          if (!hasLinkedScriptIdColumn) {
            // Add linkedScriptId column to ideas table
            this.db.prepare('ALTER TABLE ideas ADD COLUMN linkedScriptId TEXT').run();
          }
        } catch (error) {
          console.error('Failed to add columns to ideas table:', error);
          console.log('Rebuilding ideas table with new schema...');
          
          // Get existing ideas
          const oldIdeas = this.db.prepare('SELECT * FROM ideas').all() as Idea[];
          
          // Drop the table
          this.db.prepare('DROP TABLE IF EXISTS ideas').run();
          
          // Recreate the table with the new schema
          this.db.prepare(`
            CREATE TABLE ideas (
              id TEXT PRIMARY KEY,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'unrated',
              linkedScriptId TEXT,
              createdAt TEXT NOT NULL
            )
          `).run();
          
          // Reinsert the existing ideas
          const insertIdea = this.db.prepare(`
            INSERT INTO ideas (id, content, createdAt, status, linkedScriptId)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          for (const idea of oldIdeas) {
            insertIdea.run(
              idea.id,
              idea.content,
              idea.createdAt,
              'unrated',
              null
            );
          }
        }
      }
      
      // Create tags table if it doesn't exist
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        )
      `).run();
      
      // Create idea_tags table if it doesn't exist
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS idea_tags (
          ideaId TEXT NOT NULL,
          tagId TEXT NOT NULL,
          PRIMARY KEY (ideaId, tagId),
          FOREIGN KEY (ideaId) REFERENCES ideas (id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
        )
      `).run();

      // Create script_tags table for scripts
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS script_tags (
          scriptId TEXT NOT NULL,
          tagId TEXT NOT NULL,
          PRIMARY KEY (scriptId, tagId),
          FOREIGN KEY (scriptId) REFERENCES scripts (id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
        )
      `).run();
    });
    
    transaction();
  }

  // Category methods
  public getCategories(): Category[] {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
  }

  public createCategory(name: string): Category {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    this.db.prepare('INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)').run(id, name, createdAt);
    
    return { id, name, createdAt };
  }

  public updateCategory(id: string, name: string): Category {
    this.db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
  }

  public deleteCategory(id: string): boolean {
    // First, update any scripts in this category to have a null categoryId
    this.db.prepare('UPDATE scripts SET categoryId = NULL WHERE categoryId = ?').run(id);
    
    // Then delete the category
    const result = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Script methods
  public getScripts(categoryId?: string): Script[] {
    let scripts: Script[];
    
    if (categoryId) {
      scripts = this.db.prepare('SELECT * FROM scripts WHERE categoryId = ? ORDER BY updatedAt DESC').all(categoryId) as Script[];
    } else {
      scripts = this.db.prepare('SELECT * FROM scripts ORDER BY updatedAt DESC').all() as Script[];
    }
    
    // Add tags to each script
    return scripts.map(script => {
      const tags = this.getScriptTags(script.id);
      return {
        ...script,
        tags: tags.length > 0 ? tags : undefined
      };
    });
  }
  
  // Get all uncategorized scripts
  public getUncategorizedScripts(): Script[] {
    const scripts = this.db.prepare('SELECT * FROM scripts WHERE categoryId IS NULL OR categoryId = "" ORDER BY updatedAt DESC').all() as Script[];
    
    // Add tags to each script
    return scripts.map(script => {
      const tags = this.getScriptTags(script.id);
      return {
        ...script,
        tags: tags.length > 0 ? tags : undefined
      };
    });
  }

  public getScript(id: string): Script {
    const script = this.db.prepare('SELECT * FROM scripts WHERE id = ?').get(id) as Script;
    if (script) {
      const tags = this.getScriptTags(script.id);
      return {
        ...script,
        tags: tags.length > 0 ? tags : undefined
      };
    }
    return script;
  }

  public createScript(script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>): Script {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(
      'INSERT INTO scripts (id, categoryId, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, script.categoryId, script.title, script.content, now, now);
    
    return { id, ...script, createdAt: now, updatedAt: now };
  }

  public updateScript(id: string, updates: Partial<Omit<Script, 'id' | 'createdAt' | 'updatedAt'>>): Script {
    const now = new Date().toISOString();
    
    let query = 'UPDATE scripts SET updatedAt = ?';
    const params: any[] = [now];
    
    if (updates.title !== undefined) {
      query += ', title = ?';
      params.push(updates.title);
    }
    
    if (updates.content !== undefined) {
      query += ', content = ?';
      params.push(updates.content);
    }
    
    if (updates.categoryId !== undefined) {
      query += ', categoryId = ?';
      params.push(updates.categoryId);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    this.db.prepare(query).run(...params);
    
    return this.getScript(id);
  }

  public deleteScript(id: string): boolean {
    const result = this.db.prepare('DELETE FROM scripts WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Idea methods
  public getIdeas(): Idea[] {
    // First check if the necessary columns exist
    const hasLinkedScriptId = this.db.prepare("PRAGMA table_info(ideas)").all()
      .some((col: any) => col.name === 'linkedScriptId');
    
    let query = 'SELECT i.*, s.title as linkedScriptTitle, s.categoryId as linkedScriptCategoryId FROM ideas i';
    
    if (hasLinkedScriptId) {
      query += ' LEFT JOIN scripts s ON i.linkedScriptId = s.id';
    }
    
    query += ' ORDER BY i.createdAt DESC';
    
    const ideas = this.db.prepare(query).all() as (Idea & { linkedScriptTitle?: string, linkedScriptCategoryId?: string })[];
    
    // For each idea, get its tags if any
    return ideas.map(idea => {
      // Check if the idea_tags table exists before attempting to get tags
      const ideaTagsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='idea_tags'").get();
      const tags = ideaTagsExists ? this.getIdeaTags(idea.id) : [];
      
      // If there's a linked script, add minimal info about it
      let linkedScript: Partial<Script> | undefined;
      if (hasLinkedScriptId && idea.linkedScriptId && idea.linkedScriptTitle) {
        linkedScript = {
          id: idea.linkedScriptId,
          title: idea.linkedScriptTitle,
          categoryId: idea.linkedScriptCategoryId as string
        };
      }
      
      // Ensure status is set
      const status = idea.status || 'unrated';
      
      return {
        ...idea,
        tags: tags.length > 0 ? tags : undefined,
        linkedScript: linkedScript as Script | undefined,
        status
      };
    });
  }

  public createIdea(content: string): Idea {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    // Check if status column exists
    const hasStatusColumn = this.db.prepare("PRAGMA table_info(ideas)").all()
      .some((col: any) => col.name === 'status');
    
    if (hasStatusColumn) {
      this.db.prepare('INSERT INTO ideas (id, content, status, createdAt) VALUES (?, ?, ?, ?)')
        .run(id, content, 'unrated', createdAt);
    } else {
      this.db.prepare('INSERT INTO ideas (id, content, createdAt) VALUES (?, ?, ?)')
        .run(id, content, createdAt);
    }
    
    return { id, content, status: 'unrated', createdAt };
  }

  public updateIdea(id: string, updates: Partial<Omit<Idea, 'id' | 'createdAt'>>): Idea {
    let query = 'UPDATE ideas SET ';
    const params: any[] = [];
    const updateParts: string[] = [];
    
    if (updates.content !== undefined) {
      updateParts.push('content = ?');
      params.push(updates.content);
    }
    
    if (updates.status !== undefined) {
      updateParts.push('status = ?');
      params.push(updates.status);
    }
    
    if (updates.linkedScriptId !== undefined) {
      updateParts.push('linkedScriptId = ?');
      params.push(updates.linkedScriptId);
    }
    
    if (updates.categoryId !== undefined) {
      updateParts.push('categoryId = ?');
      params.push(updates.categoryId);
    }
    
    query += updateParts.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    if (updateParts.length > 0) {
      this.db.prepare(query).run(...params);
    }
    
    // Get the updated idea with its tags
    const idea = this.db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea;
    const tags = this.getIdeaTags(id);
    
    return { ...idea, tags: tags.length > 0 ? tags : undefined };
  }

  public deleteIdea(id: string): boolean {
    const result = this.db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  public setIdeaStatus(id: string, status: 'good' | 'bad' | 'unrated'): Idea {
    this.db.prepare('UPDATE ideas SET status = ? WHERE id = ?').run(status, id);
    return this.updateIdea(id, {});  // Get the full idea with tags
  }
  
  public linkIdeaToScript(ideaId: string, scriptId: string): Idea {
    this.db.prepare('UPDATE ideas SET linkedScriptId = ? WHERE id = ?').run(scriptId, ideaId);
    return this.updateIdea(ideaId, {});  // Get the full idea with tags
  }
  
  public unlinkIdeaFromScript(ideaId: string): Idea {
    this.db.prepare('UPDATE ideas SET linkedScriptId = NULL WHERE id = ?').run(ideaId);
    return this.updateIdea(ideaId, {});  // Get the full idea with tags
  }
  
  // Tag methods
  public getTags(): Tag[] {
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
  }
  
  public createTag(name: string): Tag {
    const id = uuidv4();
    try {
      this.db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
      return { id, name };
    } catch (error) {
      // Handle unique constraint violation (tag already exists)
      const existingTag = this.db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as Tag;
      if (existingTag) {
        return existingTag;
      }
      throw error;
    }
  }
  
  public deleteTag(id: string): boolean {
    const result = this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  public addTagToIdea(ideaId: string, tagId: string): boolean {
    try {
      this.db.prepare('INSERT INTO idea_tags (ideaId, tagId) VALUES (?, ?)').run(ideaId, tagId);
      return true;
    } catch (error) {
      // Handle unique constraint violation (already tagged)
      return false;
    }
  }
  
  public removeTagFromIdea(ideaId: string, tagId: string): boolean {
    const result = this.db.prepare('DELETE FROM idea_tags WHERE ideaId = ? AND tagId = ?').run(ideaId, tagId);
    return result.changes > 0;
  }
  
  public getIdeaTags(ideaId: string): Tag[] {
    // Check if idea_tags table exists
    const ideaTagsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='idea_tags'").get();
    if (!ideaTagsExists) {
      return [];
    }
    
    return this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN idea_tags it ON t.id = it.tagId
      WHERE it.ideaId = ?
      ORDER BY t.name
    `).all(ideaId) as Tag[];
  }
  
  // Script tag methods
  public getScriptTags(scriptId: string): Tag[] {
    // Check if script_tags table exists
    const scriptTagsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='script_tags'").get();
    if (!scriptTagsExists) {
      return [];
    }
    
    return this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN script_tags st ON t.id = st.tagId
      WHERE st.scriptId = ?
      ORDER BY t.name
    `).all(scriptId) as Tag[];
  }
  
  public addTagToScript(scriptId: string, tagId: string): boolean {
    try {
      // Ensure script_tags table exists
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS script_tags (
          scriptId TEXT NOT NULL,
          tagId TEXT NOT NULL,
          PRIMARY KEY (scriptId, tagId),
          FOREIGN KEY (scriptId) REFERENCES scripts (id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
        )
      `).run();
      
      this.db.prepare('INSERT INTO script_tags (scriptId, tagId) VALUES (?, ?)').run(scriptId, tagId);
      return true;
    } catch (error) {
      // Handle unique constraint violation (already tagged)
      return false;
    }
  }
  
  public removeTagFromScript(scriptId: string, tagId: string): boolean {
    // Check if script_tags table exists
    const scriptTagsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='script_tags'").get();
    if (!scriptTagsExists) {
      return false;
    }
    
    const result = this.db.prepare('DELETE FROM script_tags WHERE scriptId = ? AND tagId = ?').run(scriptId, tagId);
    return result.changes > 0;
  }
  
  // Idea Category methods
  public getIdeaCategories(): IdeaCategory[] {
    return this.db.prepare('SELECT * FROM idea_categories ORDER BY name').all() as IdeaCategory[];
  }
  
  public createIdeaCategory(name: string): IdeaCategory {
    const id = uuidv4();
    
    this.db.prepare('INSERT INTO idea_categories (id, name) VALUES (?, ?)').run(id, name);
    
    return { id, name };
  }
  
  public updateIdeaCategory(id: string, name: string): IdeaCategory {
    this.db.prepare('UPDATE idea_categories SET name = ? WHERE id = ?').run(name, id);
    
    return this.db.prepare('SELECT * FROM idea_categories WHERE id = ?').get(id) as IdeaCategory;
  }
  
  public deleteIdeaCategory(id: string): boolean {
    const result = this.db.prepare('DELETE FROM idea_categories WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  public setIdeaCategory(ideaId: string, categoryId: string): Idea {
    this.db.prepare('UPDATE ideas SET categoryId = ? WHERE id = ?').run(categoryId, ideaId);
    return this.updateIdea(ideaId, {});  // Get the full idea with tags
  }

  // Settings methods
  public getSettings(): AppSettings {
    const settings = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    
    return settings.reduce((acc, setting) => {
      return { ...acc, [setting.key]: setting.value };
    }, {} as AppSettings);
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    const updateStmt = this.db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    const insertStmt = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    
    Object.entries(settings).forEach(([key, value]) => {
      // First try to insert in case the key doesn't exist
      insertStmt.run(key, value || '');
      // Then update in case it does exist
      updateStmt.run(value || '', key);
    });
    
    console.log('Settings updated successfully, retrieving current settings');
    return this.getSettings();
  }

  // Context document methods
  public getContextDocuments(): ContextDocument[] {
    return this.db.prepare('SELECT * FROM contextDocuments ORDER BY name').all() as ContextDocument[];
  }

  public createContextDocument(name: string, filePath: string): ContextDocument {
    const id = uuidv4();
    
    this.db.prepare(
      'INSERT INTO contextDocuments (id, name, filePath, isEnabled) VALUES (?, ?, ?, 1)'
    ).run(id, name, filePath);
    
    return { id, name, filePath, isEnabled: true };
  }

  public toggleContextDocument(id: string, isEnabled: boolean): ContextDocument {
    this.db.prepare(
      'UPDATE contextDocuments SET isEnabled = ? WHERE id = ?'
    ).run(isEnabled ? 1 : 0, id);
    
    return this.db.prepare('SELECT * FROM contextDocuments WHERE id = ?').get(id) as ContextDocument;
  }

  public deleteContextDocument(id: string): boolean {
    const result = this.db.prepare('DELETE FROM contextDocuments WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService;