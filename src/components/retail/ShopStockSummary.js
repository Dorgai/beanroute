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
  console.log('ShopStockSummary RENDERING with:', {
    inventoryExists: !!inventory,
    inventoryArray: Array.isArray(inventory),
    inventoryLength: inventory?.length || 0,
    shopDetailsExists: !!shopDetails,
    shopDetailsName: shopDetails?.name || 'none',
    minSmallBags: shopDetails?.minCoffeeQuantitySmall || 'none',
    minLargeBags: shopDetails?.minCoffeeQuantityLarge || 'none'
  });

  // Only return null if shopDetails is missing
  if (!shopDetails) {
    console.log('ShopStockSummary RETURNING NULL - missing shopDetails');
    return null;
  }

  // Ensure inventory is at least an empty array
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  
  // Calculate total quantities
  const totalSmallBags = safeInventory.reduce((sum, item) => sum + (item?.smallBags || 0), 0);
  const totalLargeBags = safeInventory.reduce((sum, item) => sum + (item?.largeBags || 0), 0);
  
  // Get minimum requirements
  const minSmallBags = shopDetails.minCoffeeQuantitySmall || 10;
  const minLargeBags = shopDetails.minCoffeeQuantityLarge || 5;
  
  // Calculate percentages (with max 100%)
  const smallBagsPercentage = Math.min(100, (totalSmallBags / minSmallBags) * 100);
  const largeBagsPercentage = Math.min(100, (totalLargeBags / minLargeBags) * 100);
  
  // Determine alert levels
  const isSmallBagsCritical = totalSmallBags < minSmallBags * 0.3;
  const isSmallBagsWarning = totalSmallBags < minSmallBags * 0.7 && !isSmallBagsCritical;
  
  const isLargeBagsCritical = totalLargeBags < minLargeBags * 0.3;
  const isLargeBagsWarning = totalLargeBags < minLargeBags * 0.7 && !isLargeBagsCritical;
  
  // Determine overall status
  const hasCritical = isSmallBagsCritical || isLargeBagsCritical;
  const hasWarning = (isSmallBagsWarning || isLargeBagsWarning) && !hasCritical;
  
  // If inventory is empty, always show critical alert
  const isEmpty = safeInventory.length === 0;
  const showCritical = hasCritical || isEmpty;
  
  console.log('ShopStockSummary STATUS:', {
    totalSmallBags,
    totalLargeBags,
    minSmallBags,
    minLargeBags,
    smallBagsPercentage,
    largeBagsPercentage,
    isSmallBagsCritical,
    isSmallBagsWarning,
    isLargeBagsCritical,
    isLargeBagsWarning,
    hasCritical,
    hasWarning,
    isEmpty,
    showCritical
  });
  
  // Get progress bar colors
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  // Text colors for inventory numbers
  const getTextColor = (quantity, minimum, percentage) => {
    if (percentage < 30) return 'error.main';
    if (percentage < 70) return 'warning.main';
    return 'success.main';
  };

  return (
    <Paper 
      elevation={showCritical ? 8 : hasWarning ? 6 : 2} 
      sx={{ 
        p: 3, 
        borderLeft: showCritical ? '8px solid #f44336' : hasWarning ? '8px solid #ff9800' : '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: showCritical ? '0px 6px 16px rgba(244,67,54,0.3)' : 
                   hasWarning ? '0px 4px 14px rgba(255,152,0,0.3)' : 
                   '0px 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: showCritical ? '#fff5f5' : hasWarning ? '#fff8f0' : '#fcfcfc',
        ...sx 
      }}
    >
      {showCritical && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ 
            mb: 2, 
            fontWeight: 'medium',
            fontSize: '1rem',
            padding: '12px 16px',
            backgroundColor: 'rgba(244,67,54,0.15)',
            border: '1px solid rgba(244,67,54,0.3)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              color: '#d32f2f'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {isEmpty ? 'CRITICAL: No retail inventory found!' : 'CRITICAL: Retail inventory levels are dangerously low!'}
          </Typography>
        </Alert>
      )}
      
      {hasWarning && !showCritical && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ 
            mb: 2, 
            fontWeight: 'medium',
            fontSize: '1rem',
            padding: '12px 16px',
            backgroundColor: 'rgba(255,152,0,0.15)',
            border: '1px solid rgba(255,152,0,0.3)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              color: '#ed6c02'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            WARNING: Retail inventory levels are running low
          </Typography>
        </Alert>
      )}
      
      <Typography variant="h6" sx={{ 
        fontWeight: 'bold', 
        mb: 2, 
        color: showCritical ? 'error.main' : hasWarning ? 'warning.main' : 'inherit',
        fontSize: '1.1rem',
        textShadow: showCritical || hasWarning ? '0px 0px 1px rgba(0,0,0,0.1)' : 'none'
      }}>
        {shopDetails.name} - Inventory Summary
      </Typography>
      
      {isEmpty ? (
        <Alert severity="error" sx={{ mb: 2, fontWeight: 'medium' }}>
          No inventory data is available. Please check the inventory records.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', fontSize: '0.95rem' }}>Small Bags</Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold', 
                color: getTextColor(totalSmallBags, minSmallBags, smallBagsPercentage),
                fontSize: isSmallBagsCritical || isSmallBagsWarning ? '1rem' : '0.95rem',
                textShadow: isSmallBagsCritical ? '0px 0px 1px rgba(244,67,54,0.3)' : 
                           isSmallBagsWarning ? '0px 0px 1px rgba(255,152,0,0.3)' : 'none'
              }}>
                {totalSmallBags} in stock
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={smallBagsPercentage} 
              color={getProgressColor(smallBagsPercentage)}
              sx={{ 
                height: 12, 
                borderRadius: 6,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6
                }
              }}
            />
            {isSmallBagsCritical && (
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'medium', display: 'block', mt: 0.5, fontSize: '0.85rem' }}>
                Critical: Minimum requirement is {minSmallBags} bags
              </Typography>
            )}
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', fontSize: '0.95rem' }}>Large Bags</Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold', 
                color: getTextColor(totalLargeBags, minLargeBags, largeBagsPercentage),
                fontSize: isLargeBagsCritical || isLargeBagsWarning ? '1rem' : '0.95rem',
                textShadow: isLargeBagsCritical ? '0px 0px 1px rgba(244,67,54,0.3)' : 
                           isLargeBagsWarning ? '0px 0px 1px rgba(255,152,0,0.3)' : 'none'
              }}>
                {totalLargeBags} in stock
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={largeBagsPercentage} 
              color={getProgressColor(largeBagsPercentage)}
              sx={{ 
                height: 12, 
                borderRadius: 6,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6
                }
              }}
            />
            {isLargeBagsCritical && (
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'medium', display: 'block', mt: 0.5, fontSize: '0.85rem' }}>
                Critical: Minimum requirement is {minLargeBags} bags
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
} 