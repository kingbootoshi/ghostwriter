import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Editor from './Editor';
import Preview from './Preview';
import StatusBar from './StatusBar';
import { Category, Script, AppSettings } from '../types';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Load categories and settings on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [fetchedCategories, fetchedSettings] = await Promise.all([
          window.api.db.getCategories(),
          window.api.db.getSettings()
        ]);
        
        setCategories(fetchedCategories);
        setSettings(fetchedSettings);
        
        // Select first category by default if available
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0]);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Load scripts when category changes
  useEffect(() => {
    const loadScripts = async () => {
      if (selectedCategory) {
        try {
          const fetchedScripts = await window.api.db.getScripts(selectedCategory.id);
          setScripts(fetchedScripts);
          
          // Select first script or clear selection
          if (fetchedScripts.length > 0) {
            setSelectedScript(fetchedScripts[0]);
          } else {
            setSelectedScript(null);
          }
        } catch (error) {
          console.error('Failed to load scripts:', error);
        }
      } else {
        setScripts([]);
        setSelectedScript(null);
      }
    };
    
    loadScripts();
  }, [selectedCategory]);
  
  // Create a new script
  const handleCreateScript = async () => {
    if (!selectedCategory) return;
    
    try {
      const newScript = await window.api.db.createScript({
        categoryId: selectedCategory.id,
        title: 'New Script',
        content: '# New Script\n\nStart writing your content here...'
      });
      
      setScripts([newScript, ...scripts]);
      setSelectedScript(newScript);
    } catch (error) {
      console.error('Failed to create script:', error);
    }
  };
  
  // Save script changes
  const handleSaveScript = async (content: string) => {
    if (!selectedScript) return;
    
    try {
      const updatedScript = await window.api.db.updateScript(selectedScript.id, { content });
      
      // Update the script in the local state
      setSelectedScript(updatedScript);
      setScripts(scripts.map(script => 
        script.id === updatedScript.id ? updatedScript : script
      ));
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };
  
  // Update script title
  const handleUpdateScriptTitle = async (title: string) => {
    if (!selectedScript) return;
    
    try {
      const updatedScript = await window.api.db.updateScript(selectedScript.id, { title });
      
      // Update the script in the local state
      setSelectedScript(updatedScript);
      setScripts(scripts.map(script => 
        script.id === updatedScript.id ? updatedScript : script
      ));
    } catch (error) {
      console.error('Failed to update script title:', error);
    }
  };
  
  // Delete script
  const handleDeleteScript = async (scriptId: string) => {
    try {
      const success = await window.api.db.deleteScript(scriptId);
      
      if (success) {
        // Remove from local state
        const updatedScripts = scripts.filter(script => script.id !== scriptId);
        setScripts(updatedScripts);
        
        // Update selection if needed
        if (selectedScript?.id === scriptId) {
          setSelectedScript(updatedScripts.length > 0 ? updatedScripts[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <Sidebar 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          scripts={scripts}
          selectedScript={selectedScript}
          onSelectScript={setSelectedScript}
          onCreateScript={handleCreateScript}
          onDeleteScript={handleDeleteScript}
        />
        
        <div className="editor-container">
          {selectedScript ? (
            <>
              <Editor 
                script={selectedScript}
                onSave={handleSaveScript}
                onUpdateTitle={handleUpdateScriptTitle}
              />
              <Preview content={selectedScript.content} />
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              {selectedCategory 
                ? 'Select a script or create a new one'
                : 'Select a category to get started'}
            </div>
          )}
        </div>
      </div>
      
      <StatusBar settings={settings} />
    </div>
  );
};

export default App;