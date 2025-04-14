import React, { useState } from 'react';
import { AppSettings, OpenRouterModel, ContextDocument } from '../types';

interface StatusBarProps {
  settings: AppSettings | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ settings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(settings?.selectedModel || '');
  const [globalPrompt, setGlobalPrompt] = useState(settings?.globalPrompt || '');
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load models and context documents when settings modal is opened
  const handleOpenSettings = async () => {
    setShowSettings(true);
    setIsLoading(true);
    
    try {
      const [fetchedModels, fetchedDocs] = await Promise.all([
        window.api.ai.getModels(),
        window.api.db.getContextDocuments()
      ]);
      
      setModels(fetchedModels);
      setContextDocuments(fetchedDocs);
    } catch (error) {
      console.error('Failed to load settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    try {
      await window.api.db.updateSettings({
        selectedModel,
        globalPrompt
      });
      
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  // Add a new context document
  const handleAddContextDocument = async () => {
    try {
      const filePath = await window.api.dialog.selectFile();
      
      if (filePath) {
        // Extract filename for display
        const fileName = filePath.split('/').pop() || 'Document';
        
        const newDoc = await window.api.db.createContextDocument(fileName, filePath);
        setContextDocuments([...contextDocuments, newDoc]);
      }
    } catch (error) {
      console.error('Failed to add context document:', error);
    }
  };
  
  // Toggle a context document
  const handleToggleContextDocument = async (id: string, isEnabled: boolean) => {
    try {
      const updatedDoc = await window.api.db.toggleContextDocument(id, isEnabled);
      
      setContextDocuments(contextDocuments.map(doc => 
        doc.id === id ? updatedDoc : doc
      ));
    } catch (error) {
      console.error('Failed to toggle context document:', error);
    }
  };
  
  // Delete a context document
  const handleDeleteContextDocument = async (id: string) => {
    try {
      const success = await window.api.db.deleteContextDocument(id);
      
      if (success) {
        setContextDocuments(contextDocuments.filter(doc => doc.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete context document:', error);
    }
  };

  return (
    <div className="status-bar">
      <div>
        {settings?.selectedModel && (
          <span>Model: {settings.selectedModel}</span>
        )}
      </div>
      
      <div>
        <button 
          className="text-blue-500 hover:text-blue-600"
          onClick={handleOpenSettings}
        >
          Settings
        </button>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="ai-edit-popup">
          <div className="ai-edit-container">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">Loading...</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">AI Model</label>
                  <select 
                    className="form-input"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Global AI Prompt</label>
                  <textarea 
                    className="form-input min-h-24"
                    value={globalPrompt}
                    onChange={(e) => setGlobalPrompt(e.target.value)}
                    placeholder="Enter a system prompt to guide the AI's responses..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Context Documents</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md mb-2">
                    {contextDocuments.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">
                        No context documents added
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto">
                        {contextDocuments.map(doc => (
                          <div key={doc.id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex justify-between items-center">
                            <div className="flex items-center">
                              <input 
                                type="checkbox"
                                className="mr-2"
                                checked={doc.isEnabled}
                                onChange={(e) => handleToggleContextDocument(doc.id, e.target.checked)}
                              />
                              <span className="truncate max-w-xs">{doc.name}</span>
                            </div>
                            <button 
                              className="text-red-500"
                              onClick={() => handleDeleteContextDocument(doc.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn btn-secondary text-sm"
                    onClick={handleAddContextDocument}
                  >
                    Add Document
                  </button>
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveSettings}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBar;