import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * A reusable confirmation dialog component.
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when the dialog is closed
 * @param {string} props.title - The dialog title
 * @param {string} props.message - The confirmation message
 * @param {string} props.cancelLabel - Label for the cancel button
 * @param {string} props.confirmLabel - Label for the confirm button
 * @param {boolean} props.loading - Whether the confirm action is loading
 * @param {Function} props.onConfirm - Function to call when the action is confirmed
 * @param {string} props.severity - Severity of the dialog: 'error', 'warning', 'info' or 'success'
 */
export default function ConfirmationDialog({
  open,
  onClose,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  severity = 'warning'
}) {
  // Get color based on severity
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'success':
        return 'success.main';
      case 'info':
        return 'info.main';
      default:
        return 'warning.main';
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose(false)} maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={severity} />
        <Typography component="span" color={getSeverityColor()}>
          {title}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body1">
            {message}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => onClose(false)} 
          disabled={loading}
          variant="outlined"
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={() => onConfirm()}
          color={severity}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 