import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import databaseService from './database';
import aiService from './services/ai-service';
import { InlineEditRequest } from './types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Ensure the database is initialized
databaseService.initialize();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Need to disable sandbox to access better-sqlite3 in main process
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools in development mode.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Define IPC handlers for database operations

// Category operations
ipcMain.handle('db:getCategories', async () => {
  return databaseService.getCategories();
});

ipcMain.handle('db:createCategory', async (_, name: string) => {
  return databaseService.createCategory(name);
});

ipcMain.handle('db:updateCategory', async (_, id: string, name: string) => {
  return databaseService.updateCategory(id, name);
});

ipcMain.handle('db:deleteCategory', async (_, id: string) => {
  return databaseService.deleteCategory(id);
});

// Script operations
ipcMain.handle('db:getScripts', async (_, categoryId?: string) => {
  return databaseService.getScripts(categoryId);
});

ipcMain.handle('db:getScript', async (_, id: string) => {
  return databaseService.getScript(id);
});

ipcMain.handle('db:createScript', async (_, script) => {
  return databaseService.createScript(script);
});

ipcMain.handle('db:updateScript', async (_, id: string, updates) => {
  return databaseService.updateScript(id, updates);
});

ipcMain.handle('db:deleteScript', async (_, id: string) => {
  return databaseService.deleteScript(id);
});

// Idea operations
ipcMain.handle('db:getIdeas', async () => {
  return databaseService.getIdeas();
});

ipcMain.handle('db:createIdea', async (_, content: string) => {
  return databaseService.createIdea(content);
});

ipcMain.handle('db:updateIdea', async (_, id: string, content: string) => {
  return databaseService.updateIdea(id, content);
});

ipcMain.handle('db:deleteIdea', async (_, id: string) => {
  return databaseService.deleteIdea(id);
});

// Settings operations
ipcMain.handle('db:getSettings', async () => {
  return databaseService.getSettings();
});

ipcMain.handle('db:updateSettings', async (_, settings) => {
  return databaseService.updateSettings(settings);
});

// Context document operations
ipcMain.handle('db:getContextDocuments', async () => {
  return databaseService.getContextDocuments();
});

ipcMain.handle('db:createContextDocument', async (_, name: string, filePath: string) => {
  return databaseService.createContextDocument(name, filePath);
});

ipcMain.handle('db:toggleContextDocument', async (_, id: string, isEnabled: boolean) => {
  return databaseService.toggleContextDocument(id, isEnabled);
});

ipcMain.handle('db:deleteContextDocument', async (_, id: string) => {
  return databaseService.deleteContextDocument(id);
});

// File dialog for selecting context documents
ipcMain.handle('dialog:selectFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text files', extensions: ['txt', 'md'] }
    ]
  });
  
  if (canceled || filePaths.length === 0) {
    return null;
  }
  
  return filePaths[0];
});

// AI operations
ipcMain.handle('ai:getModels', async () => {
  try {
    return await aiService.getModels();
  } catch (error) {
    console.error('Error getting models:', error);
    throw error;
  }
});

ipcMain.handle('ai:performInlineEdit', async (_, request: InlineEditRequest) => {
  try {
    return await aiService.performInlineEdit(request);
  } catch (error) {
    console.error('Error performing inline edit:', error);
    throw error;
  }
});