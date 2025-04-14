import React, { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { Script, InlineEditRequest, InlineEditResponse } from '../types';

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
  
  // Update editor content when script changes
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