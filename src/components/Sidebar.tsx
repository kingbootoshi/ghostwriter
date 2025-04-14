import React, { useState } from 'react';
import { Category, Script } from '../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  scripts: Script[];
  selectedScript: Script | null;
  onSelectScript: (script: Script) => void;
  onCreateScript: () => void;
  onDeleteScript: (scriptId: string) => void;
  onCreateCategory: () => void;
  onUpdateCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  activeView: 'scripts' | 'ideas' | 'uncategorized';
  onSelectView: (view: 'ideas' | 'uncategorized' | Category) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  scripts,
  selectedScript,
  onSelectScript,
  onCreateScript,
  onDeleteScript,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  activeView,
  onSelectView
}) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState<string | null>(null);
  
  // Handle category actions
  const handleCategoryContextMenu = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsContextMenuOpen(isContextMenuOpen === categoryId ? null : categoryId);
  };
  
  const handleRenameCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const newName = prompt('Enter new category name:', category.name);
    if (newName && newName !== category.name) {
      onUpdateCategory(categoryId, newName);
    }
    
    setIsContextMenuOpen(null);
  };
  
  const handleDeleteCategoryClick = (categoryId: string) => {
    setIsContextMenuOpen(null);
    onDeleteCategory(categoryId);
  };
  
  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsContextMenuOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="sidebar">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">Ghostwriter</h1>
      </div>
      
      {/* Ideas - Always the first item */}
      <div 
        className={`category-item ${activeView === 'ideas' ? 'active' : ''}`}
        onClick={() => onSelectView('ideas')}
      >
        <div className="flex items-center">
          <span className="flex-grow">Ideas</span>
          <span className="text-blue-500">✨</span>
        </div>
      </div>
      
      {/* Uncategorized Scripts */}
      <div 
        className={`category-item ${activeView === 'uncategorized' ? 'active' : ''}`}
        onClick={() => onSelectView('uncategorized')}
      >
        <div className="flex items-center">
          <span className="flex-grow">Uncategorized</span>
          <span className="text-gray-500">📄</span>
        </div>
      </div>
      
      {/* Category heading with "Add" button */}
      <div className="p-3 border-t border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="font-medium">Categories</span>
        <button 
          className="btn-circle text-sm"
          onClick={onCreateCategory}
          title="Add Category"
        >
          +
        </button>
      </div>
      
      {/* Category list */}
      <div className="category-list">
        {categories.map(category => (
          <div 
            key={category.id}
            className={`category-item ${activeView === 'scripts' && selectedCategory?.id === category.id ? 'active' : ''}`}
            onClick={() => onSelectView(category)}
            onContextMenu={(e) => handleCategoryContextMenu(e, category.id)}
          >
            <div className="flex justify-between items-center">
              <span className="truncate">{category.name}</span>
              <button 
                className="text-gray-500 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryContextMenu(e, category.id);
                }}
              >
                ⋯
              </button>
            </div>
            
            {/* Context menu for category */}
            {isContextMenuOpen === category.id && (
              <div className="category-context-menu">
                <div 
                  className="context-menu-item"
                  onClick={() => handleRenameCategory(category.id)}
                >
                  Rename
                </div>
                <div 
                  className="context-menu-item text-red-500"
                  onClick={() => handleDeleteCategoryClick(category.id)}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Show scripts list when a category is selected or we're in uncategorized view */}
      {((activeView === 'scripts' && selectedCategory) || activeView === 'uncategorized') && (
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
            
            {scripts.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No scripts in this category
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;