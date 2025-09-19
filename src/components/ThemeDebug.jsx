import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeDebug = () => {
  const { theme, isDark, isLoading } = useTheme();
  const [htmlClasses, setHtmlClasses] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHtmlClasses(document.documentElement.className);
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px 10px', 
        borderRadius: '5px', 
        zIndex: 1000 
      }}>
        Loading theme...
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      color: 'white', 
      padding: '5px 10px', 
      borderRadius: '5px', 
      zIndex: 1000,
      fontSize: '12px'
    }}>
      <div>Theme: {theme}</div>
      <div>Is Dark: {isDark ? 'Yes' : 'No'}</div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>HTML Classes: {htmlClasses}</div>
      <button 
        onClick={() => {
          const newTheme = theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          setHtmlClasses(document.documentElement.className);
        }}
        style={{
          marginTop: '5px',
          padding: '2px 5px',
          fontSize: '10px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Toggle Theme
      </button>
    </div>
  );
};

export default ThemeDebug;