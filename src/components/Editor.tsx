import React, { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { Script, InlineEditRequest, InlineEditResponse, Tag } from '../types';

interface EditorProps {
  script: Script;
  onSave: (content: string) => void;
  onUpdateTitle: (title: string) => void;
}

const Editor: React.FC<EditorProps> = ({ script, onSave, onUpdateTitle }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [title, setTitle] = useState(script.title);
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editResult, setEditResult] = useState<InlineEditResponse | null>(null);
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  
  // Initialize the editor
  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const view = new EditorView({
        doc: script.content,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onSave(update.state.doc.toString());
            }
          }),
        ],
        parent: editorRef.current,
      });
      
      viewRef.current = view;
    }
    
    // Clean up
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);
  
  // Update editor content and load tags when script changes
  useEffect(() => {
    if (viewRef.current && script.content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: script.content
        }
      });
    }
    
    setTitle(script.title);
    
    // Load all available tags
    const loadTags = async () => {
      try {
        const tags = await window.api.db.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    
    loadTags();
  }, [script]);
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  // Save title when focus is lost
  const handleTitleBlur = () => {
    if (title.trim() && title !== script.title) {
      onUpdateTitle(title);
    }
  };
  
  // Handle key press for title input
  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };
  
  // Get selected text for AI edit
  const handleAIEdit = () => {
    const selection = viewRef.current?.state.selection.main;
    
    if (selection && !selection.empty) {
      const from = selection.from;
      const to = selection.to;
      const selectedContent = viewRef.current?.state.doc.sliceString(from, to);
      
      if (selectedContent) {
        setSelectedText(selectedContent);
        setShowAIEdit(true);
      }
    }
  };
  
  // Close the AI edit popup
  const handleCloseAIEdit = () => {
    setShowAIEdit(false);
    setInstruction('');
    setEditResult(null);
  };
  
  // Apply the AI edit to the editor
  const handleApplyAIEdit = () => {
    if (editResult && viewRef.current) {
      const selection = viewRef.current.state.selection.main;
      
      viewRef.current.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: editResult.modifiedText
        }
      });
      
      handleCloseAIEdit();
    }
  };
  
  // Submit the AI edit request
  const handleSubmitAIEdit = async () => {
    if (!instruction.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const request: InlineEditRequest = {
        selectedText,
        context: script.content,
        instruction: instruction.trim()
      };
      
      const response = await window.api.ai.performInlineEdit(request);
      setEditResult(response);
    } catch (error) {
      console.error('Failed to perform AI edit:', error);
      alert('Failed to perform AI edit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Tag management methods
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const newTag = await window.api.db.createTag(newTagName.trim());
      setNewTagName('');
      
      // Add to available tags if it doesn't already exist
      if (!availableTags.some(tag => tag.id === newTag.id)) {
        setAvailableTags([...availableTags, newTag]);
      }
      
      // Add the tag to the script
      await window.api.db.addTagToScript(script.id, newTag.id);
      
      // Update the script's tags
      const updatedTags = await window.api.db.getScriptTags(script.id);
      script.tags = updatedTags;
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };
  
  const handleToggleTag = async (tag: Tag) => {
    try {
      const hasTag = script.tags?.some(t => t.id === tag.id);
      
      if (hasTag) {
        // Remove tag
        await window.api.db.removeTagFromScript(script.id, tag.id);
      } else {
        // Add tag
        await window.api.db.addTagToScript(script.id, tag.id);
      }
      
      // Update the script's tags
      const updatedTags = await window.api.db.getScriptTags(script.id);
      script.tags = updatedTags;
    } catch (error) {
      console.error('Failed to toggle tag:', error);
    }
  };

  return (
    <div className="editor-pane">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          className="w-full text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1 rounded"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyPress={handleTitleKeyPress}
        />
        
        {/* Tags */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {script.tags?.map(tag => (
            <span 
              key={tag.id} 
              className="tag cursor-pointer"
              onClick={() => handleToggleTag(tag)}
            >
              {tag.name}
              <button className="tag-remove ml-1">×</button>
            </span>
          ))}
          
          <div className="relative">
            <button
              className="btn-circle"
              onClick={() => setShowTagsMenu(!showTagsMenu)}
              title="Manage Tags"
            >
              +
            </button>
            
            {showTagsMenu && (
              <div className="dropdown-menu w-64">
                <div className="p-2">
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      placeholder="New tag name..."
                      className="form-input text-sm py-1 flex-1"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag();
                      }}
                    />
                    <button
                      className="btn btn-primary text-sm py-1"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto">
                    {availableTags.length === 0 ? (
                      <div className="text-gray-500 text-sm p-2">No tags available.</div>
                    ) : (
                      availableTags.map(tag => {
                        const isSelected = script.tags?.some(t => t.id === tag.id);
                        return (
                          <div
                            key={tag.id}
                            className={`dropdown-item flex items-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                            onClick={() => handleToggleTag(tag)}
                          >
                            <span className="flex-1">{tag.name}</span>
                            {isSelected && <span className="text-blue-500">✓</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div ref={editorRef} className="h-full" />
        
        {/* Floating tools */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button 
            className="btn btn-primary"
            onClick={handleAIEdit}
          >
            AI Edit
          </button>
        </div>
      </div>
      
      {/* AI Edit Popup */}
      {showAIEdit && (
        <div className="ai-edit-popup">
          <div className="ai-edit-container">
            <h3 className="text-lg font-bold mb-3">AI Edit</h3>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-32">
              <pre className="whitespace-pre-wrap">{selectedText}</pre>
            </div>
            
            <div className="mb-4">
              <label className="form-label">Instructions</label>
              <input
                type="text"
                className="form-input"
                placeholder="E.g., Make this more concise, Rewrite in a funny tone..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </div>
            
            {editResult && (
              <div className="mb-4">
                <label className="form-label">Result</label>
                <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap">{editResult.modifiedText}</pre>
                </div>
                
                {editResult.reasoning && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="font-medium">Reasoning:</div>
                    <p>{editResult.reasoning}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                className="btn btn-secondary"
                onClick={handleCloseAIEdit}
              >
                Cancel
              </button>
              
              {!editResult ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmitAIEdit}
                  disabled={isProcessing || !instruction.trim()}
                >
                  {isProcessing ? 'Processing...' : 'Submit'}
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={handleApplyAIEdit}
                >
                  Apply Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;