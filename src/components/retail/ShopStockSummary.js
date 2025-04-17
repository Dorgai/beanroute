import React from 'react';
import { Box, Typography, LinearProgress, Alert, Paper } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Component to display a summary of shop stock levels with progress bars
 * @param {Object} props
 * @param {Array} props.inventory - Array of inventory items for the shop
 * @param {Object} props.shopDetails - Shop details including minimum stock requirements
 * @param {Object} props.sx - Custom sx styling to be passed to the Paper component
 */
export default function ShopStockSummary({ inventory, shopDetails, sx = {} }) {
  if (!inventory || !Array.isArray(inventory) || inventory.length === 0 || !shopDetails) {
    return null;
  }

  // Calculate total quantities
  const totalSmallBags = inventory.reduce((sum, item) => sum + (item.smallBags || 0), 0);
  const totalLargeBags = inventory.reduce((sum, item) => sum + (item.largeBags || 0), 0);
  
  // Get minimum requirements
  const minSmallBags = shopDetails.minCoffeeQuantitySmall || 0;
  const minLargeBags = shopDetails.minCoffeeQuantityLarge || 0;
  
  // Calculate percentages (with max 100%)
  const smallBagsPercentage = minSmallBags > 0 
    ? Math.min(100, Math.round((totalSmallBags / minSmallBags) * 100)) 
    : 100;
  
  const largeBagsPercentage = minLargeBags > 0 
    ? Math.min(100, Math.round((totalLargeBags / minLargeBags) * 100)) 
    : 100;
  
  // Determine alert levels
  const isSmallBagsCritical = smallBagsPercentage < 50;
  const isSmallBagsWarning = smallBagsPercentage >= 50 && smallBagsPercentage < 75;
  
  const isLargeBagsCritical = largeBagsPercentage < 50;
  const isLargeBagsWarning = largeBagsPercentage >= 50 && largeBagsPercentage < 75;
  
  // Determine if we should show alerts
  const showAlert = isSmallBagsCritical || isLargeBagsCritical || isSmallBagsWarning || isLargeBagsWarning;
  
  // Get progress bar colors
  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'error';
    if (percentage < 75) return 'warning';
    return 'success';
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, ...sx }}>
      <Typography variant="h6" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center',
        color: showAlert ? (isSmallBagsCritical || isLargeBagsCritical ? '#d32f2f' : '#ed6c02') : 'inherit'
      }}>
        {showAlert && (
          isSmallBagsCritical || isLargeBagsCritical ? 
            <ErrorIcon sx={{ mr: 1, color: '#d32f2f' }} /> : 
            <WarningIcon sx={{ mr: 1, color: '#ed6c02' }} />
        )}
        Shop Stock Summary
      </Typography>
      
      {/* Small Bags Stock */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">
            Small Bags (250g)
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'medium',
              color: isSmallBagsCritical ? '#d32f2f' : isSmallBagsWarning ? '#ed6c02' : 'inherit'
            }}
          >
            {totalSmallBags} / {minSmallBags} min required ({smallBagsPercentage}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={smallBagsPercentage} 
          color={getProgressColor(smallBagsPercentage)}
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>
      
      {/* Large Bags Stock */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">
            Large Bags (1kg)
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'medium',
              color: isLargeBagsCritical ? '#d32f2f' : isLargeBagsWarning ? '#ed6c02' : 'inherit'
            }}
          >
            {totalLargeBags} / {minLargeBags} min required ({largeBagsPercentage}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={largeBagsPercentage} 
          color={getProgressColor(largeBagsPercentage)}
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>
      
      {/* Stock Alert */}
      {showAlert && (
        <Alert 
          severity={isSmallBagsCritical || isLargeBagsCritical ? 'error' : 'warning'}
          icon={isSmallBagsCritical || isLargeBagsCritical ? <ErrorIcon /> : <WarningIcon />}
          sx={{ mt: 2, fontWeight: 'medium' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {isSmallBagsCritical || isLargeBagsCritical 
              ? 'Critical Low Stock Alert! Inventory levels are below 50% of minimum requirements.'
              : 'Low Stock Warning! Inventory levels are below 75% of minimum requirements.'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {isSmallBagsCritical && 'Small bags are critically low. '}
            {isLargeBagsCritical && 'Large bags are critically low. '}
            {!isSmallBagsCritical && isSmallBagsWarning && 'Small bags are running low. '}
            {!isLargeBagsCritical && isLargeBagsWarning && 'Large bags are running low. '}
            Please consider placing an order soon.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
} 