import React, { useEffect, useState } from 'react';
import { renderMarkdown } from '../utils/markdown';

interface PreviewProps {
  content: string;
}

const Preview: React.FC<PreviewProps> = ({ content }) => {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
    // Convert markdown to HTML for display
    setHtml(renderMarkdown(content));
  }, [content]);

  return (
    <div className="preview-pane">
      <div 
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default Preview;