import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeWrapper({ children }) {
  const { theme, isLoading } = useTheme();
  
  // Don't render until theme is loaded to prevent hydration mismatch
  if (isLoading) {
    return null;
  }
  
  const muiTheme = createAppTheme(theme);
  
  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
}