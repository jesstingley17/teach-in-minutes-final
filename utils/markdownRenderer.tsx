import React from 'react';

/**
 * Simple markdown renderer for basic formatting (bold, italic)
 * Converts markdown syntax to React elements
 */
export const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return text;

  // Simple approach: process markdown sequentially
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Process bold **text** first (more specific pattern)
  const processBold = (str: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(str)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        result.push(str.substring(lastIndex, match.index));
      }
      // Add bold text (process italic inside)
      result.push(<strong key={`bold-${key++}`}>{processItalic(match[1])}</strong>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < str.length) {
      result.push(str.substring(lastIndex));
    }

    return result.length > 0 ? result : [str];
  };

  // Process italic *text* (single asterisk, not double)
  const processItalic = (str: string): React.ReactNode => {
    const italicRegex = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let partKey = 0;

    while ((match = italicRegex.exec(str)) !== null) {
      // Add text before italic
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      // Add italic text
      parts.push(<em key={`italic-${partKey++}`}>{match[1]}</em>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : str;
  };

  const processed = processBold(text);
  return processed.length > 0 ? <>{processed}</> : text;
};
