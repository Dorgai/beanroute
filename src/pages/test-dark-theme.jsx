import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { Box, Typography, Paper, Button } from '@mui/material';

export default function TestDarkTheme() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <Box className="min-h-screen p-8" sx={{ bgcolor: 'background.default' }}>
      <Paper className="p-6 max-w-2xl mx-auto" sx={{ bgcolor: 'background.paper' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dark Theme Test
        </Typography>
        
        <Box className="mb-4">
          <Typography variant="body1" className="mb-2">
            Current theme: <strong>{theme}</strong>
          </Typography>
          <Typography variant="body1" className="mb-2">
            Is dark mode: <strong>{isDark ? 'Yes' : 'No'}</strong>
          </Typography>
        </Box>

        <Box className="mb-4">
          <ThemeToggle />
        </Box>

        <Box className="mb-4">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={toggleTheme}
            className="mr-2"
          >
            Toggle Theme
          </Button>
        </Box>

        <Box className="space-y-4">
          <Paper className="p-4" sx={{ bgcolor: 'background.paper' }}>
            <Typography variant="h6" color="primary">
              Primary Color Test
            </Typography>
            <Typography variant="body2">
              This should change color based on theme
            </Typography>
          </Paper>

          <Paper className="p-4" sx={{ bgcolor: 'background.paper' }}>
            <Typography variant="h6" color="secondary">
              Secondary Color Test
            </Typography>
            <Typography variant="body2">
              This should change color based on theme
            </Typography>
          </Paper>

          <Paper className="p-4" sx={{ bgcolor: 'background.paper' }}>
            <Typography variant="h6" color="error">
              Error Color Test
            </Typography>
            <Typography variant="body2">
              This should change color based on theme
            </Typography>
          </Paper>
        </Box>

        <Box className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <Typography variant="body2" className="text-gray-900 dark:text-gray-100">
            This is a Tailwind CSS test - should be light gray in light mode, dark gray in dark mode
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
