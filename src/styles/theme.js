import { createTheme } from '@mui/material/styles';

// Define more vibrant color palette
const theme = createTheme({
  palette: {
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
      main: '#ff9100', // Vibrant orange
      light: '#ffb74d',
      dark: '#ff6d00',
      contrastText: '#000',
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
      default: '#ffffff',
      paper: '#ffffff',
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
          backgroundColor: '#ffebee',
          color: '#d32f2f',
        },
        standardWarning: {
          backgroundColor: '#fff8e1',
          color: '#f57c00',
        },
        standardSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
        },
      },
    },
  },
});

export default theme; 