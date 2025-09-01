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
  const [smallBagsEspresso, setSmallBagsEspresso] = useState('');
  const [smallBagsFilter, setSmallBagsFilter] = useState('');
  const [largeBags, setLargeBags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Initialize form values when dialog opens
  useEffect(() => {
    if (open && inventoryItem) {
      // Handle the case where we have either smallBags or smallBagsEspresso/smallBagsFilter
      setSmallBagsEspresso(inventoryItem.smallBagsEspresso || 0);
      setSmallBagsFilter(inventoryItem.smallBagsFilter || 0);
      setLargeBags(inventoryItem.largeBags || 0);
      updateTotalQuantity(
        inventoryItem.smallBagsEspresso || 0, 
        inventoryItem.smallBagsFilter || 0, 
        inventoryItem.largeBags || 0
      );
    } else {
      // Reset form when dialog closes
      setSmallBagsEspresso('');
      setSmallBagsFilter('');
      setLargeBags('');
      setTotalQuantity(0);
      setError(null);
    }
  }, [open, inventoryItem]);

  // Calculate and set the total quantity
  const updateTotalQuantity = (espresso, filter, large) => {
    const espressoValue = parseInt(espresso) || 0;
    const filterValue = parseInt(filter) || 0;
    const largeValue = parseInt(large) || 0;
    const total = ((espressoValue + filterValue) * 0.2) + (largeValue * 1.0);
    setTotalQuantity(total);
  };

  // Handle changes to espresso bags quantity
  const handleEspressoBagsChange = (e) => {
    const value = e.target.value;
    setSmallBagsEspresso(value);
    updateTotalQuantity(value, smallBagsFilter, largeBags);
  };

  // Handle changes to filter bags quantity
  const handleFilterBagsChange = (e) => {
    const value = e.target.value;
    setSmallBagsFilter(value);
    updateTotalQuantity(smallBagsEspresso, value, largeBags);
  };

  // Handle changes to large bags quantity
  const handleLargeBagsChange = (e) => {
    const value = e.target.value;
    setLargeBags(value);
    updateTotalQuantity(smallBagsEspresso, smallBagsFilter, value);
  };

  // Submit the inventory update
  const handleSubmit = async () => {
    // Input validation
    if (smallBagsEspresso === '' && smallBagsFilter === '' && largeBags === '') {
      setError('Please enter at least one quantity.');
      return;
    }

    const espressoValue = parseInt(smallBagsEspresso) || 0;
    const filterValue = parseInt(smallBagsFilter) || 0;
    const largeBagsValue = parseInt(largeBags) || 0;

    if ((smallBagsEspresso !== '' && (isNaN(espressoValue) || espressoValue < 0)) || 
        (smallBagsFilter !== '' && (isNaN(filterValue) || filterValue < 0)) ||
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
          smallBagsEspresso: espressoValue,
          smallBagsFilter: filterValue,
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
            • Small Bags (200g): {inventoryItem.smallBags || 
              ((inventoryItem.smallBagsEspresso || 0) + (inventoryItem.smallBagsFilter || 0)) || 0}
            {inventoryItem.smallBagsEspresso !== undefined && inventoryItem.smallBagsFilter !== undefined && (
              <>
                <br />
                &nbsp;&nbsp;- Espresso: {inventoryItem.smallBagsEspresso || 0}
                <br />
                &nbsp;&nbsp;- Filter: {inventoryItem.smallBagsFilter || 0}
              </>
            )}
            <br />
            • Large Bags (1kg): {inventoryItem.largeBags || 0}
            <br />
            • Total: {inventoryItem.totalQuantity || 0} kg
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Espresso Bags (200g)"
            type="number"
            value={smallBagsEspresso}
            onChange={handleEspressoBagsChange}
            margin="normal"
            size="small"
            InputProps={{
              inputProps: { min: 0, step: 1 }
            }}
            helperText="For espresso coffee preparation"
          />
          <TextField
            fullWidth
            label="Filter Bags (200g)"
            type="number"
            value={smallBagsFilter}
            onChange={handleFilterBagsChange}
            margin="normal"
            size="small"
            InputProps={{
              inputProps: { min: 0, step: 1 }
            }}
            helperText="For filter/drip coffee preparation"
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