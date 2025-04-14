import { marked } from 'marked';

/**
 * Safely renders markdown content to HTML.
 * 
 * @param markdown The markdown content to render
 * @returns HTML rendered from markdown
 */
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub flavored markdown
    breaks: true, // Convert \n to <br>
    smartypants: true, // Typography like "" to proper quotes
    sanitize: false, // Don't sanitize - marked does escape by default
  });
  
  // Render markdown to HTML
  return marked.parse(markdown);
};

/**
 * Creates a sanitized ID from a string for use in HTML
 * 
 * @param str The string to convert to an ID
 * @returns A sanitized ID string
 */
export const createIdFromString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace whitespace with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};