import { createTheme } from '@mui/material/styles';

// Create a function to generate theme based on mode
const createAppTheme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2', // Vibrant blue
      light: '#4791db',
      dark: '#115293',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Vibrant pink
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    error: {
      main: '#ff1744', // Vibrant red
      light: '#ff4569',
      dark: '#d50000',
      contrastText: '#fff',
    },
    warning: {
      main: mode === 'dark' ? '#f59e0b' : '#ff9100', // Amber for dark mode, orange for light
      light: mode === 'dark' ? '#fbbf24' : '#ffb74d',
      dark: mode === 'dark' ? '#d97706' : '#ff6d00',
      contrastText: mode === 'dark' ? '#000' : '#000',
    },
    info: {
      main: '#2979ff', // Vibrant blue
      light: '#448aff',
      dark: '#2962ff',
      contrastText: '#fff',
    },
    success: {
      main: '#00c853', // Vibrant green
      light: '#69f0ae',
      dark: '#00a040',
      contrastText: '#000',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
      A100: '#d5d5d5',
      A200: '#aaaaaa',
      A400: '#303030',
      A700: '#616161',
    },
    background: {
      default: mode === 'dark' ? '#1f2937' : '#ffffff',
      paper: mode === 'dark' ? '#374151' : '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        standardError: {
          backgroundColor: mode === 'dark' ? '#2d1b1b' : '#ffebee',
          color: mode === 'dark' ? '#f8bbd9' : '#d32f2f',
          '& .MuiTypography-root': {
            fontWeight: mode === 'dark' ? 'normal' : 'bold',
          },
        },
        standardWarning: {
          backgroundColor: mode === 'dark' ? '#1e3a8a' : '#e3f2fd',
          color: mode === 'dark' ? '#93c5fd' : '#1976d2',
        },
        standardSuccess: {
          backgroundColor: mode === 'dark' ? '#1b2d1b' : '#e8f5e9',
          color: mode === 'dark' ? '#a5d6a7' : '#2e7d32',
        },
        standardInfo: {
          backgroundColor: mode === 'dark' ? '#1e3a8a' : '#e3f2fd',
          color: mode === 'dark' ? '#93c5fd' : '#1976d2',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#4b5563' : '#ffffff',
          border: mode === 'dark' ? 'none' : '1px solid #e0e0e0',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#374151' : '#f5f5f5',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: mode === 'dark' ? '#f9fafb' : '#000000',
          fontWeight: 'bold',
        },
        body: {
          color: mode === 'dark' ? '#f9fafb' : '#000000',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: mode === 'dark' ? '#4b5563' : '#f9f9f9',
          },
          '&:nth-of-type(odd)': {
            backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
          },
        },
      },
    },
  },
});

// Export the function and a default light theme
export { createAppTheme };
export default createAppTheme('light');