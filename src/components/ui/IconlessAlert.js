import { Alert } from '@mui/material';
import { forwardRef } from 'react';

/**
 * A wrapper around Material-UI Alert component that removes the icon
 */
const IconlessAlert = forwardRef((props, ref) => {
  return (
    <Alert 
      ref={ref} 
      icon={false} 
      sx={{
        '&.MuiAlert-standardWarning': {
          bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#fff3cd',
          color: theme => theme.palette.mode === 'dark' ? '#fbbf24' : '#664d03',
          border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #ffeaa7'
        },
        '&.MuiAlert-standardInfo': {
          bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#d1ecf1',
          color: theme => theme.palette.mode === 'dark' ? '#60a5fa' : '#0c5460',
          border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #bee5eb'
        },
        '&.MuiAlert-standardError': {
          bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#f8d7da',
          color: theme => theme.palette.mode === 'dark' ? '#f87171' : '#721c24',
          border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #f5c6cb'
        }
      }}
      {...props} 
    />
  );
});

IconlessAlert.displayName = 'IconlessAlert';

export default IconlessAlert; 