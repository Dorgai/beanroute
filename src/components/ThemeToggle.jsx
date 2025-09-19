import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const ThemeToggle = ({ size = 'medium', sx = {} }) => {
  const { isDark, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return null; // Don't render until theme is loaded
  }

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        size={size}
        sx={{
          ...sx,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? (
          <Brightness7 sx={{ fontSize: 'inherit' }} />
        ) : (
          <Brightness4 sx={{ fontSize: 'inherit' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
