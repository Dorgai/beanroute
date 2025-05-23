import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import IconlessAlert from '../ui/IconlessAlert';

export default function InventoryUpdateDialog({ open, onClose, inventoryItem, refreshData }) {
  const [smallBags, setSmallBags] = useState('');
  const [largeBags, setLargeBags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Initialize form values when dialog opens
  useEffect(() => {
    if (open && inventoryItem) {
      setSmallBags(inventoryItem.smallBags || 0);
      setLargeBags(inventoryItem.largeBags || 0);
      updateTotalQuantity(inventoryItem.smallBags || 0, inventoryItem.largeBags || 0);
    } else {
      // Reset form when dialog closes
      setSmallBags('');
      setLargeBags('');
      setTotalQuantity(0);
      setError(null);
    }
  }, [open, inventoryItem]);

  // Calculate and set the total quantity
  const updateTotalQuantity = (small, large) => {
    const smallValue = parseInt(small) || 0;
    const largeValue = parseInt(large) || 0;
    const total = (smallValue * 0.2) + (largeValue * 1.0);
    setTotalQuantity(total);
  };

  // Handle changes to small bags quantity
  const handleSmallBagsChange = (e) => {
    const value = e.target.value;
    setSmallBags(value);
    updateTotalQuantity(value, largeBags);
  };

  // Handle changes to large bags quantity
  const handleLargeBagsChange = (e) => {
    const value = e.target.value;
    setLargeBags(value);
    updateTotalQuantity(smallBags, value);
  };

  // Submit the inventory update
  const handleSubmit = async () => {
    // Input validation
    if (smallBags === '' && largeBags === '') {
      setError('Please enter at least one quantity.');
      return;
    }

    const smallBagsValue = parseInt(smallBags);
    const largeBagsValue = parseInt(largeBags);

    if ((smallBags !== '' && (isNaN(smallBagsValue) || smallBagsValue < 0)) || 
        (largeBags !== '' && (isNaN(largeBagsValue) || largeBagsValue < 0))) {
      setError('Quantities must be non-negative numbers.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/retail/update-inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryId: inventoryItem.id,
          smallBags: smallBagsValue,
          largeBags: largeBagsValue
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update inventory');
      }

      // Force a refresh of the data
      setTimeout(() => {
        if (refreshData && typeof refreshData === 'function') {
          refreshData();
        }
      }, 500);
      
      onClose(true); // Pass true to indicate successful update
    } catch (err) {
      setError(err.message || 'An error occurred while updating inventory');
    } finally {
      setLoading(false);
    }
  };

  if (!inventoryItem) {
    return null;
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update Inventory: {inventoryItem.coffee?.name || 'Coffee'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <IconlessAlert severity="error" sx={{ mb: 2 }}>
            {error}
          </IconlessAlert>
        )}

        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Coffee: <strong>{inventoryItem.coffee?.name || 'Unknown'}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Grade: {inventoryItem.coffee?.grade?.replace('_', ' ') || 'Unknown'}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Current Inventory:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            • Small Bags (200g): {inventoryItem.smallBags || 0}
            <br />
            • Large Bags (1kg): {inventoryItem.largeBags || 0}
            <br />
            • Total: {inventoryItem.totalQuantity || 0} kg
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Small Bags (200g)"
            type="number"
            value={smallBags}
            onChange={(e) => setSmallBags(e.target.value)}
            margin="normal"
            size="small"
            InputProps={{
              inputProps: { min: 0, step: 1 }
            }}
          />
          <TextField
            label="Large Bags (1kg)"
            type="number"
            value={largeBags}
            onChange={handleLargeBagsChange}
            InputProps={{ inputProps: { min: 0 } }}
            fullWidth
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">
              New Total Quantity: {totalQuantity.toFixed(2)} kg
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update Inventory'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 