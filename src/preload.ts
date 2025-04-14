// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { API, InlineEditRequest } from './types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Database API
  db: {
    // Category methods
    getCategories: () => ipcRenderer.invoke('db:getCategories'),
    createCategory: (name: string) => ipcRenderer.invoke('db:createCategory', name),
    updateCategory: (id: string, name: string) => ipcRenderer.invoke('db:updateCategory', id, name),
    deleteCategory: (id: string) => ipcRenderer.invoke('db:deleteCategory', id),
    
    // Script methods
    getScripts: (categoryId?: string) => ipcRenderer.invoke('db:getScripts', categoryId),
    getScript: (id: string) => ipcRenderer.invoke('db:getScript', id),
    createScript: (script: any) => ipcRenderer.invoke('db:createScript', script),
    updateScript: (id: string, updates: any) => ipcRenderer.invoke('db:updateScript', id, updates),
    deleteScript: (id: string) => ipcRenderer.invoke('db:deleteScript', id),
    
    // Idea methods
    getIdeas: () => ipcRenderer.invoke('db:getIdeas'),
    createIdea: (content: string) => ipcRenderer.invoke('db:createIdea', content),
    updateIdea: (id: string, content: string) => ipcRenderer.invoke('db:updateIdea', id, content),
    deleteIdea: (id: string) => ipcRenderer.invoke('db:deleteIdea', id),
    
    // Settings methods
    getSettings: () => ipcRenderer.invoke('db:getSettings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('db:updateSettings', settings),
    
    // Context document methods
    getContextDocuments: () => ipcRenderer.invoke('db:getContextDocuments'),
    createContextDocument: (name: string, filePath: string) => 
      ipcRenderer.invoke('db:createContextDocument', name, filePath),
    toggleContextDocument: (id: string, isEnabled: boolean) => 
      ipcRenderer.invoke('db:toggleContextDocument', id, isEnabled),
    deleteContextDocument: (id: string) => ipcRenderer.invoke('db:deleteContextDocument', id),
  },
  
  // AI API
  ai: {
    getModels: () => ipcRenderer.invoke('ai:getModels'),
    performInlineEdit: (request: InlineEditRequest) => ipcRenderer.invoke('ai:performInlineEdit', request),
  },
  
  // Dialog API
  dialog: {
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  },
  
  // Version information
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
} as API);