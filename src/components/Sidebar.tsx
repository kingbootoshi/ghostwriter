import React, { useState } from 'react';
import { Category, Script, Idea } from '../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  scripts: Script[];
  selectedScript: Script | null;
  onSelectScript: (script: Script) => void;
  onCreateScript: () => void;
  onDeleteScript: (scriptId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  scripts,
  selectedScript,
  onSelectScript,
  onCreateScript,
  onDeleteScript
}) => {
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  
  // Load ideas when the Ideas category is selected
  React.useEffect(() => {
    const loadIdeas = async () => {
      if (selectedCategory?.name === 'Ideas') {
        try {
          const fetchedIdeas = await window.api.db.getIdeas();
          setIdeas(fetchedIdeas);
        } catch (error) {
          console.error('Failed to load ideas:', error);
        }
      }
    };
    
    loadIdeas();
  }, [selectedCategory]);
  
  // Add a new idea
  const handleAddIdea = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newIdeaContent.trim()) {
      try {
        const newIdea = await window.api.db.createIdea(newIdeaContent.trim());
        setIdeas([newIdea, ...ideas]);
        setNewIdeaContent('');
      } catch (error) {
        console.error('Failed to create idea:', error);
      }
    }
  };
  
  // Delete an idea
  const handleDeleteIdea = async (ideaId: string) => {
    try {
      const success = await window.api.db.deleteIdea(ideaId);
      if (success) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
      }
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">Ghostwriter</h1>
      </div>
      
      <div className="category-list p-2">
        {categories.map(category => (
          <div 
            key={category.id}
            className={`category-item ${selectedCategory?.id === category.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category.name}
          </div>
        ))}
      </div>
      
      {selectedCategory?.name === 'Ideas' ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Type a new idea and press Enter..."
              className="idea-input"
              value={newIdeaContent}
              onChange={(e) => setNewIdeaContent(e.target.value)}
              onKeyDown={handleAddIdea}
            />
          </div>
          
          <div className="ideas-list">
            {ideas.map(idea => (
              <div key={idea.id} className="idea-item group">
                <div className="flex justify-between">
                  <p>{idea.content}</p>
                  <button 
                    className="text-red-500 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteIdea(idea.id)}
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 border-t border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="font-medium">Scripts</span>
            <button 
              className="btn btn-primary text-sm py-1 px-2"
              onClick={onCreateScript}
            >
              New
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {scripts.map(script => (
              <div 
                key={script.id}
                className={`script-item group ${selectedScript?.id === script.id ? 'active' : ''}`}
                onClick={() => onSelectScript(script)}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate">{script.title}</span>
                  <button 
                    className="text-red-500 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScript(script.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;