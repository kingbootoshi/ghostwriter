import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Editor from './Editor';
import Preview from './Preview';
import StatusBar from './StatusBar';
import IdeasView from './IdeasView';
import { Category, Script, AppSettings } from '../types';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeView, setActiveView] = useState<'scripts' | 'ideas' | 'uncategorized'>('scripts');
  
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
      } else if (activeView === 'uncategorized') {
        try {
          const fetchedScripts = await window.api.db.getUncategorizedScripts();
          setScripts(fetchedScripts);
          
          // Select first script or clear selection
          if (fetchedScripts.length > 0) {
            setSelectedScript(fetchedScripts[0]);
          } else {
            setSelectedScript(null);
          }
        } catch (error) {
          console.error('Failed to load uncategorized scripts:', error);
        }
      } else {
        setScripts([]);
        setSelectedScript(null);
      }
    };
    
    loadScripts();
  }, [selectedCategory, activeView]);
  
  // Create a new script
  const handleCreateScript = async () => {
    try {
      const newScript = await window.api.db.createScript({
        categoryId: selectedCategory?.id || null,
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
  
  // Create a new category
  const handleCreateCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name || name.trim() === '') return;
    
    try {
      const newCategory = await window.api.db.createCategory(name.trim());
      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };
  
  // Update category name
  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    if (!newName || newName.trim() === '') return;
    
    try {
      const updatedCategory = await window.api.db.updateCategory(categoryId, newName.trim());
      
      // Update categories in state
      setCategories(categories.map(category => 
        category.id === updatedCategory.id ? updatedCategory : category
      ));
      
      // Update selected category if needed
      if (selectedCategory?.id === updatedCategory.id) {
        setSelectedCategory(updatedCategory);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };
  
  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    // Ask for confirmation and handle orphaned scripts
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this category? All scripts in this category will be deleted.'
    );
    
    if (!confirmDelete) return;
    
    try {
      const success = await window.api.db.deleteCategory(categoryId);
      
      if (success) {
        // Remove category from state
        const updatedCategories = categories.filter(category => category.id !== categoryId);
        setCategories(updatedCategories);
        
        // Update selected category if needed
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(updatedCategories.length > 0 ? updatedCategories[0] : null);
        }
        
        // Clear scripts if the deleted category was selected
        if (selectedCategory?.id === categoryId) {
          setScripts([]);
          setSelectedScript(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };
  
  // Handle selecting the Ideas view or a script category
  const handleSelectView = (view: 'ideas' | 'uncategorized' | Category) => {
    if (view === 'ideas') {
      setActiveView('ideas');
      setSelectedCategory(null);
    } else if (view === 'uncategorized') {
      setActiveView('uncategorized');
      setSelectedCategory(null);
    } else {
      setActiveView('scripts');
      setSelectedCategory(view);
    }
  };
  
  // Handle selecting a script in IdeasView (navigating from a linked idea)
  const handleSelectScriptFromIdeas = (script: Script) => {
    // Find the category for this script
    const category = categories.find(cat => cat.id === script.categoryId);
    if (category) {
      setSelectedCategory(category);
      setSelectedScript(script);
      setActiveView('scripts');
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
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          activeView={activeView}
          onSelectView={handleSelectView}
        />
        
        <div className="main-content">
          {activeView === 'ideas' ? (
            <IdeasView onSelectScript={handleSelectScriptFromIdeas} />
          ) : (
            selectedScript ? (
              <div className="editor-container">
                <Editor 
                  script={selectedScript}
                  onSave={handleSaveScript}
                  onUpdateTitle={handleUpdateScriptTitle}
                />
                <Preview content={selectedScript.content} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                {activeView === 'uncategorized' || selectedCategory 
                  ? 'Select a script or create a new one'
                  : 'Select a category or the Uncategorized section to get started'}
              </div>
            )
          )}
        </div>
      </div>
      
      <StatusBar settings={settings} />
    </div>
  );
};

export default App;