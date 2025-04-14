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
    const result = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Script methods
  public getScripts(categoryId?: string): Script[] {
    if (categoryId) {
      return this.db.prepare('SELECT * FROM scripts WHERE categoryId = ? ORDER BY updatedAt DESC').all(categoryId) as Script[];
    }
    
    return this.db.prepare('SELECT * FROM scripts ORDER BY updatedAt DESC').all() as Script[];
  }

  public getScript(id: string): Script {
    return this.db.prepare('SELECT * FROM scripts WHERE id = ?').get(id) as Script;
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
    return this.db.prepare('SELECT * FROM ideas ORDER BY createdAt DESC').all() as Idea[];
  }

  public createIdea(content: string): Idea {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    this.db.prepare('INSERT INTO ideas (id, content, createdAt) VALUES (?, ?, ?)').run(id, content, createdAt);
    
    return { id, content, createdAt };
  }

  public updateIdea(id: string, content: string): Idea {
    this.db.prepare('UPDATE ideas SET content = ? WHERE id = ?').run(content, id);
    
    return this.db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea;
  }

  public deleteIdea(id: string): boolean {
    const result = this.db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return result.changes > 0;
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