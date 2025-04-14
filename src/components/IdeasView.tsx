import React, { useState, useEffect } from 'react';
import { Idea, Script, Tag, IdeaCategory } from '../types';

interface IdeaCardProps {
  idea: Idea;
  scripts: Script[];
  tags: Tag[];
  categories: IdeaCategory[];
  onUpdate: (id: string, updates: Partial<Omit<Idea, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onSelectScript: (script: Script) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  scripts,
  tags,
  categories,
  onUpdate,
  onDelete,
  onSelectScript
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(idea.content);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle idea status change
  const handleStatusChange = (status: 'good' | 'bad' | 'unrated') => {
    onUpdate(idea.id, { status });
  };
  
  // Handle save edit
  const handleSaveEdit = () => {
    if (editContent.trim() !== '') {
      onUpdate(idea.id, { content: editContent.trim() });
      setIsEditing(false);
    }
  };
  
  // Handle linking to script
  const handleLinkScript = (scriptId: string) => {
    onUpdate(idea.id, { linkedScriptId: scriptId });
    setIsLinkMenuOpen(false);
  };
  
  // Handle unlinking from script
  const handleUnlinkScript = () => {
    onUpdate(idea.id, { linkedScriptId: undefined });
  };
  
  // Handle opening linked script
  const handleOpenLinkedScript = () => {
    if (idea.linkedScript) {
      onSelectScript(idea.linkedScript);
    }
  };
  
  // Handle tag operations
  const handleAddTag = async (tagName: string) => {
    try {
      const tag = await window.api.db.createTag(tagName);
      await window.api.db.addTagToIdea(idea.id, tag.id);
      
      // Update the idea to include the new tag
      const updatedTags = await window.api.db.getIdeaTags(idea.id);
      onUpdate(idea.id, { tags: updatedTags });
      
      setIsTagMenuOpen(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };
  
  const handleRemoveTag = async (tagId: string) => {
    try {
      await window.api.db.removeTagFromIdea(idea.id, tagId);
      
      // Update the idea's tags
      const updatedTags = await window.api.db.getIdeaTags(idea.id);
      onUpdate(idea.id, { tags: updatedTags });
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };
  
  // Handle category operations
  const handleSetCategory = (categoryId: string) => {
    onUpdate(idea.id, { categoryId });
    setIsCategoryMenuOpen(false);
  };
  
  // Get current category name
  const getCurrentCategoryName = () => {
    if (!idea.categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === idea.categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  return (
    <div className="idea-card">
      {isEditing ? (
        <div className="mb-2">
          <textarea
            className="form-input mb-2"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary text-sm py-1 px-2"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary text-sm py-1 px-2"
              onClick={handleSaveEdit}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-2 idea-content">{idea.content}</p>
      )}
      
      <div className="idea-meta">
        <div className="text-xs text-gray-500 mb-2">
          {formatDate(idea.createdAt)}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Status indicators */}
          <div className="flex gap-1">
            <button
              className={`btn-status ${idea.status === 'good' ? 'active' : ''}`}
              onClick={() => handleStatusChange('good')}
              title="Mark as Good Idea"
            >
              👍
            </button>
            <button
              className={`btn-status ${idea.status === 'bad' ? 'active' : ''}`}
              onClick={() => handleStatusChange('bad')}
              title="Mark as Bad Idea"
            >
              👎
            </button>
            {idea.status !== 'unrated' && (
              <button
                className="btn-status"
                onClick={() => handleStatusChange('unrated')}
                title="Reset Status"
              >
                ⊘
              </button>
            )}
          </div>
          
          {/* Tags display */}
          <div className="flex flex-wrap gap-1">
            {idea.tags?.map(tag => (
              <span key={tag.id} className="tag">
                {tag.name}
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="relative">
              <button
                className="btn-circle"
                onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                title="Add Tag"
              >
                +
              </button>
              {isTagMenuOpen && (
                <div className="dropdown-menu tag-menu">
                  <input
                    type="text"
                    placeholder="Type a tag name and press Enter"
                    className="form-input mb-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="max-h-32 overflow-auto">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className="dropdown-item"
                        onClick={() => handleAddTag(tag.name)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Category */}
          <div className="relative ml-auto">
            <button
              className="category-label"
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
            >
              {getCurrentCategoryName()}
            </button>
            {isCategoryMenuOpen && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => handleSetCategory('')}
                >
                  Uncategorized
                </div>
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="dropdown-item"
                    onClick={() => handleSetCategory(category.id)}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Script link */}
        <div className="flex items-center justify-between mt-2">
          <div>
            {idea.linkedScript ? (
              <div className="linked-script">
                <span
                  className="linked-script-title"
                  onClick={handleOpenLinkedScript}
                >
                  📄 {idea.linkedScript.title}
                </span>
                <button
                  className="btn-circle"
                  onClick={handleUnlinkScript}
                  title="Unlink Script"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  className="btn btn-secondary text-xs py-1 px-2"
                  onClick={() => setIsLinkMenuOpen(!isLinkMenuOpen)}
                >
                  Link to Script
                </button>
                {isLinkMenuOpen && (
                  <div className="dropdown-menu script-menu">
                    {scripts.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No scripts available
                      </div>
                    ) : (
                      scripts.map(script => (
                        <div
                          key={script.id}
                          className="dropdown-item"
                          onClick={() => handleLinkScript(script.id)}
                        >
                          {script.title}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              className="btn btn-secondary text-xs py-1 px-2"
              onClick={() => setIsEditing(true)}
              title="Edit Idea"
            >
              Edit
            </button>
            <button
              className="btn btn-danger text-xs py-1 px-2"
              onClick={() => onDelete(idea.id)}
              title="Delete Idea"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface IdeasViewProps {
  onSelectScript: (script: Script) => void;
}

const IdeasView: React.FC<IdeasViewProps> = ({ onSelectScript }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status?: 'good' | 'bad' | 'unrated';
    categoryId?: string;
    tagId?: string;
    search?: string;
  }>({});
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [
          fetchedIdeas, 
          fetchedScripts, 
          fetchedTags, 
          fetchedCategories
        ] = await Promise.all([
          window.api.db.getIdeas(),
          window.api.db.getScripts(), // Get all scripts across categories
          window.api.db.getTags(),
          window.api.db.getIdeaCategories()
        ]);
        
        setIdeas(fetchedIdeas);
        setScripts(fetchedScripts);
        setTags(fetchedTags);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to load ideas data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Handle creating a new idea
  const handleCreateIdea = async () => {
    if (newIdeaContent.trim() === '') return;
    
    try {
      const newIdea = await window.api.db.createIdea(newIdeaContent.trim());
      setIdeas([newIdea, ...ideas]);
      setNewIdeaContent('');
    } catch (error) {
      console.error('Failed to create idea:', error);
    }
  };
  
  // Handle updating an idea
  const handleUpdateIdea = async (ideaId: string, updates: Partial<Omit<Idea, 'id' | 'createdAt'>>) => {
    try {
      const updatedIdea = await window.api.db.updateIdea(ideaId, updates);
      
      // Update ideas array with the updated idea
      setIdeas(ideas.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    } catch (error) {
      console.error('Failed to update idea:', error);
    }
  };
  
  // Handle updating idea status
  const handleSetIdeaStatus = async (ideaId: string, status: 'good' | 'bad' | 'unrated') => {
    try {
      const updatedIdea = await window.api.db.setIdeaStatus(ideaId, status);
      
      // Update ideas array with the updated idea
      setIdeas(ideas.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    } catch (error) {
      console.error('Failed to update idea status:', error);
    }
  };
  
  // Handle linking idea to script
  const handleLinkToScript = async (ideaId: string, scriptId: string) => {
    try {
      const updatedIdea = await window.api.db.linkIdeaToScript(ideaId, scriptId);
      
      // Update ideas array with the updated idea
      setIdeas(ideas.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    } catch (error) {
      console.error('Failed to link idea to script:', error);
    }
  };
  
  // Handle unlinking idea from script
  const handleUnlinkFromScript = async (ideaId: string) => {
    try {
      const updatedIdea = await window.api.db.unlinkIdeaFromScript(ideaId);
      
      // Update ideas array with the updated idea
      setIdeas(ideas.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      ));
    } catch (error) {
      console.error('Failed to unlink idea from script:', error);
    }
  };
  
  // Handle deleting an idea
  const handleDeleteIdea = async (ideaId: string) => {
    try {
      const success = await window.api.db.deleteIdea(ideaId);
      
      if (success) {
        // Remove the deleted idea from the ideas array
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
      }
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };
  
  // Handle creating a new category
  const handleCreateCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name || name.trim() === '') return;
    
    try {
      const newCategory = await window.api.db.createIdeaCategory(name.trim());
      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };
  
  // Filter ideas based on current filter settings
  const filteredIdeas = ideas.filter(idea => {
    // Filter by status
    if (filter.status && idea.status !== filter.status) {
      return false;
    }
    
    // Filter by category
    if (filter.categoryId) {
      if (filter.categoryId === 'uncategorized') {
        if (idea.categoryId) {
          return false;
        }
      } else if (idea.categoryId !== filter.categoryId) {
        return false;
      }
    }
    
    // Filter by tag
    if (filter.tagId && (!idea.tags || !idea.tags.some(tag => tag.id === filter.tagId))) {
      return false;
    }
    
    // Filter by search term
    if (filter.search && !idea.content.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilter: Partial<typeof filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilter({});
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-500">Loading ideas...</div>
      </div>
    );
  }
  
  return (
    <div className="ideas-view">
      {/* Add idea input */}
      <div className="ideas-input-container">
        <input
          type="text"
          placeholder="Type a new idea and press Enter..."
          className="ideas-input"
          value={newIdeaContent}
          onChange={(e) => setNewIdeaContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCreateIdea();
            }
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleCreateIdea}
          disabled={!newIdeaContent.trim()}
        >
          Add Idea
        </button>
      </div>
      
      {/* Filters */}
      <div className="filters-container">
        <div className="flex items-center gap-2">
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select
              className="filter-select"
              value={filter.status || ''}
              onChange={(e) => handleFilterChange({ 
                status: e.target.value === '' ? undefined : e.target.value as any 
              })}
            >
              <option value="">All</option>
              <option value="good">Good Ideas</option>
              <option value="bad">Bad Ideas</option>
              <option value="unrated">Unrated</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Category:</label>
            <select
              className="filter-select"
              value={filter.categoryId || ''}
              onChange={(e) => handleFilterChange({ 
                categoryId: e.target.value === '' ? undefined : e.target.value 
              })}
            >
              <option value="">All</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Tag:</label>
            <select
              className="filter-select"
              value={filter.tagId || ''}
              onChange={(e) => handleFilterChange({ 
                tagId: e.target.value === '' ? undefined : e.target.value 
              })}
            >
              <option value="">All</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group flex-grow">
            <input
              type="text"
              placeholder="Search ideas..."
              className="filter-input"
              value={filter.search || ''}
              onChange={(e) => handleFilterChange({ 
                search: e.target.value === '' ? undefined : e.target.value 
              })}
            />
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={handleClearFilters}
            disabled={!filter.status && !filter.categoryId && !filter.tagId && !filter.search}
          >
            Clear Filters
          </button>
          
          <button
            className="btn btn-primary ml-auto"
            onClick={handleCreateCategory}
          >
            New Category
          </button>
        </div>
      </div>
      
      {/* Ideas grid */}
      {filteredIdeas.length === 0 ? (
        <div className="no-ideas">
          <p>No ideas found. Add your first idea above!</p>
        </div>
      ) : (
        <div className="ideas-grid">
          {filteredIdeas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              scripts={scripts}
              tags={tags}
              categories={categories}
              onUpdate={handleUpdateIdea}
              onDelete={handleDeleteIdea}
              onSelectScript={onSelectScript}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeasView;