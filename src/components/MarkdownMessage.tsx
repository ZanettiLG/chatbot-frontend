import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const MarkdownContainer = styled(Box)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';
  
  return {
    '& p': {
      margin: '0.5em 0',
      lineHeight: 1.6,
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: '1em',
      marginBottom: '0.5em',
      fontWeight: 600,
    },
    '& h1': {
      fontSize: '1.5em',
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingBottom: '0.3em',
    },
    '& h2': {
      fontSize: '1.3em',
    },
    '& h3': {
      fontSize: '1.1em',
    },
    '& ul, & ol': {
      margin: '0.5em 0',
      paddingLeft: '1.5em',
    },
    '& li': {
      margin: '0.25em 0',
      lineHeight: 1.6,
    },
    '& strong': {
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& code': {
      backgroundColor: isDark 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.06)',
      padding: '0.2em 0.4em',
      borderRadius: '3px',
      fontSize: '0.9em',
      fontFamily: 'monospace',
    },
    '& pre': {
      backgroundColor: isDark 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)',
      padding: '1em',
      borderRadius: '4px',
      overflow: 'auto',
      margin: '0.5em 0',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.divider}`,
      paddingLeft: '1em',
      margin: '0.5em 0',
      color: theme.palette.text.secondary,
      fontStyle: 'italic',
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '0.5em 0',
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.divider}`,
      padding: '0.5em',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: isDark 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)',
      fontWeight: 600,
    },
    '& hr': {
      border: 'none',
      borderTop: `1px solid ${theme.palette.divider}`,
      margin: '1em 0',
    },
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };
});

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ children }) => {
  return (
    <MarkdownContainer>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </MarkdownContainer>
  );
};

export default MarkdownMessage;
