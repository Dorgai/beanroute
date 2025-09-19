import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeProvider({ children }) {
  const { theme, isLoading } = useTheme();
  
  // Create Material-UI theme based on current theme mode
  const muiTheme = createAppTheme(theme);
  
  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
}

