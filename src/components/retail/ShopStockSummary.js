import React from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Component to display a summary of shop stock levels with progress bars
 * @param {Object} props
 * @param {Array} props.inventory - Array of inventory items for the shop
 * @param {Object} props.shopDetails - Shop details including minimum stock requirements
 * @param {Object} props.sx - Custom sx styling to be passed to the Paper component
 */
export default function ShopStockSummary({ inventory, shopDetails, sx = {} }) {
  const { isDark } = useTheme();
  
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
  
  // Calculate total quantities - separate espresso and filter bags
  const totalEspressoBags = safeInventory.reduce((sum, item) => sum + (item?.smallBagsEspresso || 0), 0);
  const totalFilterBags = safeInventory.reduce((sum, item) => sum + (item?.smallBagsFilter || 0), 0);
  const totalLargeBags = safeInventory.reduce((sum, item) => sum + (item?.largeBags || 0), 0);
  
  // Get minimum requirements - use separate espresso/filter minimums if available
  const minEspressoBags = shopDetails.minCoffeeQuantityEspresso || shopDetails.minCoffeeQuantitySmall || 10;
  const minFilterBags = shopDetails.minCoffeeQuantityFilter || shopDetails.minCoffeeQuantitySmall || 10;
  const minLargeBags = shopDetails.minCoffeeQuantityLarge || 5;
  
  // Calculate percentages (with max 100%)
  const espressoBagsPercentage = Math.min(100, (totalEspressoBags / minEspressoBags) * 100);
  const filterBagsPercentage = Math.min(100, (totalFilterBags / minFilterBags) * 100);
  const largeBagsPercentage = Math.min(100, (totalLargeBags / minLargeBags) * 100);
  
  // Determine alert levels
  const isEspressoBagsCritical = totalEspressoBags < minEspressoBags * 0.3;
  const isEspressoBagsWarning = totalEspressoBags < minEspressoBags * 0.7 && !isEspressoBagsCritical;
  
  const isFilterBagsCritical = totalFilterBags < minFilterBags * 0.3;
  const isFilterBagsWarning = totalFilterBags < minFilterBags * 0.7 && !isFilterBagsCritical;
  
  const isLargeBagsCritical = totalLargeBags < minLargeBags * 0.3;
  const isLargeBagsWarning = totalLargeBags < minLargeBags * 0.7 && !isLargeBagsCritical;
  
  // Determine overall status
  const hasCritical = isEspressoBagsCritical || isFilterBagsCritical || isLargeBagsCritical;
  const hasWarning = (isEspressoBagsWarning || isFilterBagsWarning || isLargeBagsWarning) && !hasCritical;
  
  // If inventory is empty, always show critical alert
  const isEmpty = safeInventory.length === 0;
  const showCritical = hasCritical || isEmpty;
  
  console.log('ShopStockSummary STATUS:', {
    totalEspressoBags,
    totalFilterBags,
    totalLargeBags,
    minEspressoBags,
    minFilterBags,
    minLargeBags,
    espressoBagsPercentage,
    filterBagsPercentage,
    largeBagsPercentage,
    isEspressoBagsCritical,
    isEspressoBagsWarning,
    isFilterBagsCritical,
    isFilterBagsWarning,
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
    <Box 
      sx={{ 
        p: 3, 
        borderRadius: '4px',
        backgroundColor: 'transparent',
        ...sx 
      }}
    >
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold', 
        mb: 2, 
        color: isDark ? '#f3f4f6' : '#333333',
        fontSize: '0.9rem',
        textShadow: showCritical || hasWarning ? '0px 0px 1px rgba(0,0,0,0.1)' : 'none'
      }}>
        {shopDetails.name} - Inventory Summary
      </Typography>
      
      {isEmpty ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            fontWeight: 'medium',
            '& .MuiAlert-icon': {
              color: '#ff1744'
            }
          }}
        >
          No inventory data is available. Please check the inventory records.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            {/* Espresso Bags Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.85rem', color: isDark ? '#d1d5db' : 'inherit' }}>Espresso Bags</Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold', 
                  color: getTextColor(totalEspressoBags, minEspressoBags, espressoBagsPercentage),
                  fontSize: isEspressoBagsCritical || isEspressoBagsWarning ? '0.85rem' : '0.8rem',
                  textShadow: isEspressoBagsCritical ? '0px 0px 1px rgba(255,23,68,0.3)' : 
                             isEspressoBagsWarning ? '0px 0px 1px rgba(255,145,0,0.3)' : 'none'
                }}>
                  {totalEspressoBags} in stock
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={espressoBagsPercentage} 
                color={getProgressColor(espressoBagsPercentage)}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: isDark ? '#374151' : '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    bgcolor: espressoBagsPercentage < 30 ? '#ff0000' :
                            espressoBagsPercentage < 70 ? '#ff8000' : undefined
                  }
                }}
              />
              {isEspressoBagsCritical && (
                <Typography variant="caption" sx={{ color: '#ff1744', fontWeight: 'medium', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                  Critical: Minimum requirement is {minEspressoBags} bags
                </Typography>
              )}
            </Box>

            {/* Filter Bags Progress Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.85rem', color: isDark ? '#d1d5db' : 'inherit' }}>Filter Bags</Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold', 
                  color: getTextColor(totalFilterBags, minFilterBags, filterBagsPercentage),
                  fontSize: isFilterBagsCritical || isFilterBagsWarning ? '0.85rem' : '0.8rem',
                  textShadow: isFilterBagsCritical ? '0px 0px 1px rgba(255,23,68,0.3)' : 
                             isFilterBagsWarning ? '0px 0px 1px rgba(255,145,0,0.3)' : 'none'
                }}>
                  {totalFilterBags} in stock
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={filterBagsPercentage} 
                color={getProgressColor(filterBagsPercentage)}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: isDark ? '#374151' : '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    bgcolor: filterBagsPercentage < 30 ? '#ff0000' :
                            filterBagsPercentage < 70 ? '#ff8000' : undefined
                  }
                }}
              />
              {isFilterBagsCritical && (
                <Typography variant="caption" sx={{ color: '#ff1744', fontWeight: 'medium', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                  Critical: Minimum requirement is {minFilterBags} bags
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.85rem', color: isDark ? '#d1d5db' : 'inherit' }}>Large Bags</Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 'bold', 
                color: getTextColor(totalLargeBags, minLargeBags, largeBagsPercentage),
                fontSize: isLargeBagsCritical || isLargeBagsWarning ? '0.85rem' : '0.8rem',
                textShadow: isLargeBagsCritical ? '0px 0px 1px rgba(255,23,68,0.3)' : 
                           isLargeBagsWarning ? '0px 0px 1px rgba(255,145,0,0.3)' : 'none'
              }}>
                {totalLargeBags} in stock
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={largeBagsPercentage} 
              color={getProgressColor(largeBagsPercentage)}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: isDark ? '#374151' : '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  bgcolor: largeBagsPercentage < 30 ? '#ff0000' :
                          largeBagsPercentage < 70 ? '#ff8000' : undefined
                }
              }}
            />
            {isLargeBagsCritical && (
              <Typography variant="caption" sx={{ color: '#ff1744', fontWeight: 'medium', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                Critical: Minimum requirement is {minLargeBags} bags
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
} 