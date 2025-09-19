import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Use initial theme from script if available, otherwise default to dark
    if (typeof window !== 'undefined' && window.__INITIAL_THEME__) {
      return window.__INITIAL_THEME__;
    }
    return 'dark';
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    console.log('[ThemeContext] Initializing theme...');
    console.log('[ThemeContext] window.__INITIAL_THEME__:', window.__INITIAL_THEME__);
    
    // Use initial theme from script if available
    if (window.__INITIAL_THEME__) {
      console.log('[ThemeContext] Using initial theme from script:', window.__INITIAL_THEME__);
      setTheme(window.__INITIAL_THEME__);
      setIsLoading(false);
      return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    console.log('[ThemeContext] Saved theme:', savedTheme);
    console.log('[ThemeContext] Prefers dark:', prefersDark);
    
    // Use saved theme, or system preference, or default to dark
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'dark');
    
    console.log('[ThemeContext] Setting initial theme:', initialTheme);
    setTheme(initialTheme);
    setIsLoading(false);
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    console.log('[ThemeContext] Applied dark class:', document.documentElement.classList.contains('dark'));
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('[ThemeContext] Toggling theme from', theme, 'to', newTheme);
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    console.log('[ThemeContext] Applied dark class:', document.documentElement.classList.contains('dark'));
  };

  const isDark = theme === 'dark';

  const value = {
    theme,
    isDark,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};