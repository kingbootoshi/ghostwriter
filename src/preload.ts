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
    getUncategorizedScripts: () => ipcRenderer.invoke('db:getUncategorizedScripts'),
    getScript: (id: string) => ipcRenderer.invoke('db:getScript', id),
    createScript: (script: any) => ipcRenderer.invoke('db:createScript', script),
    updateScript: (id: string, updates: any) => ipcRenderer.invoke('db:updateScript', id, updates),
    deleteScript: (id: string) => ipcRenderer.invoke('db:deleteScript', id),
    
    // Idea methods
    getIdeas: () => ipcRenderer.invoke('db:getIdeas'),
    createIdea: (content: string) => ipcRenderer.invoke('db:createIdea', content),
    updateIdea: (id: string, updates: any) => ipcRenderer.invoke('db:updateIdea', id, updates),
    deleteIdea: (id: string) => ipcRenderer.invoke('db:deleteIdea', id),
    setIdeaStatus: (id: string, status: string) => ipcRenderer.invoke('db:setIdeaStatus', id, status),
    linkIdeaToScript: (ideaId: string, scriptId: string) => ipcRenderer.invoke('db:linkIdeaToScript', ideaId, scriptId),
    unlinkIdeaFromScript: (ideaId: string) => ipcRenderer.invoke('db:unlinkIdeaFromScript', ideaId),
    
    // Tag methods
    getTags: () => ipcRenderer.invoke('db:getTags'),
    createTag: (name: string) => ipcRenderer.invoke('db:createTag', name),
    deleteTag: (id: string) => ipcRenderer.invoke('db:deleteTag', id),
    addTagToIdea: (ideaId: string, tagId: string) => ipcRenderer.invoke('db:addTagToIdea', ideaId, tagId),
    removeTagFromIdea: (ideaId: string, tagId: string) => ipcRenderer.invoke('db:removeTagFromIdea', ideaId, tagId),
    getIdeaTags: (ideaId: string) => ipcRenderer.invoke('db:getIdeaTags', ideaId),
    
    // Script tag methods
    getScriptTags: (scriptId: string) => ipcRenderer.invoke('db:getScriptTags', scriptId),
    addTagToScript: (scriptId: string, tagId: string) => ipcRenderer.invoke('db:addTagToScript', scriptId, tagId),
    removeTagFromScript: (scriptId: string, tagId: string) => ipcRenderer.invoke('db:removeTagFromScript', scriptId, tagId),
    
    // Idea Category methods
    getIdeaCategories: () => ipcRenderer.invoke('db:getIdeaCategories'),
    createIdeaCategory: (name: string) => ipcRenderer.invoke('db:createIdeaCategory', name),
    updateIdeaCategory: (id: string, name: string) => ipcRenderer.invoke('db:updateIdeaCategory', id, name),
    deleteIdeaCategory: (id: string) => ipcRenderer.invoke('db:deleteIdeaCategory', id),
    setIdeaCategory: (ideaId: string, categoryId: string) => ipcRenderer.invoke('db:setIdeaCategory', ideaId, categoryId),
    
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
    refreshApiKey: () => ipcRenderer.invoke('ai:refreshApiKey'),
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