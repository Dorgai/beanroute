import React, { useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material';

// Constants for bag sizes in kg
const SMALL_BAG_SIZE = 0.2; // 200g
const LARGE_BAG_SIZE = 1.0; // 1kg

/**
 * Component to display a summary of pending orders grouped by coffee
 * @param {Object} props
 * @param {Array} props.orders - Array of orders to summarize
 * @param {boolean} props.showShopInfo - Whether to show shop information in the summary (for multi-shop view)
 * @param {boolean} props.hideHeader - Whether to hide the component's header
 * @param {boolean} props.aggregateAcrossShops - Whether to aggregate data across all shops
 */
export default function PendingOrdersSummary({ 
  orders, 
  showShopInfo = false, 
  hideHeader = false,
  aggregateAcrossShops = false
}) {
  // Filter only pending orders
  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === 'PENDING');
  }, [orders]);

  // Calculate summary data - group by coffee name and shop if needed
  const summaryData = useMemo(() => {
    // Initialize an object to store aggregated data
    const aggregatedData = {};

    // Process each pending order
    pendingOrders.forEach(order => {
      // Process each item in the order
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!item.coffee || !item.coffee.name) return;
          
          const coffeeName = item.coffee.name;
          const coffeeGrade = item.coffee.grade?.replace('_', ' ') || 'Unknown';
          const shopId = order.shopId || 'unknown';
          const shopName = order.shop?.name || 'Unknown Shop';
          const smallBags = item.smallBags || 0;
          const largeBags = item.largeBags || 0;
          
          // Create a unique key for aggregation
          // If aggregating across shops, group only by coffee
          // Otherwise, if showing shop info, group by coffee and shop, otherwise just by coffee
          let key;
          if (aggregateAcrossShops) {
            key = `${coffeeName}_${coffeeGrade}`;
          } else if (showShopInfo) {
            key = `${coffeeName}_${shopId}`;
          } else {
            key = coffeeName;
          }
          
          // Initialize entry if it doesn't exist
          if (!aggregatedData[key]) {
            aggregatedData[key] = {
              name: coffeeName,
              grade: coffeeGrade,
              shopId: shopId,
              shopName: shopName,
              smallBags: 0,
              largeBags: 0,
              totalKg: 0
            };
          }
          
          // Add to the aggregated data
          aggregatedData[key].smallBags += smallBags;
          aggregatedData[key].largeBags += largeBags;
          
          // Calculate total in kg (using the correct small bag size of 200g)
          const totalKg = (smallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
          aggregatedData[key].totalKg += totalKg;
        });
      }
    });
    
    // Convert object to array and sort by shop name (if showing shop info) and then coffee name
    return Object.values(aggregatedData).sort((a, b) => {
      if (showShopInfo && !aggregateAcrossShops) {
        // First sort by shop name
        const shopCompare = a.shopName.localeCompare(b.shopName);
        if (shopCompare !== 0) return shopCompare;
      }
      // Then sort by coffee name
      return a.name.localeCompare(b.name);
    });
  }, [pendingOrders, showShopInfo, aggregateAcrossShops]);

  // Calculate totals for the summary
  const totals = useMemo(() => {
    return summaryData.reduce((acc, item) => {
      return {
        smallBags: acc.smallBags + item.smallBags,
        largeBags: acc.largeBags + item.largeBags,
        totalKg: acc.totalKg + item.totalKg
      };
    }, { smallBags: 0, largeBags: 0, totalKg: 0 });
  }, [summaryData]);

  // If there are no pending orders, don't render anything
  if (pendingOrders.length === 0 || summaryData.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4, mt: 2 }}>
      {!hideHeader && (
        <>
          <Typography variant="h6" gutterBottom>
            Pending Orders Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This table summarizes all pending orders, grouped by coffee type.
          </Typography>
        </>
      )}
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Coffee</TableCell>
              <TableCell>Grade</TableCell>
              {showShopInfo && !aggregateAcrossShops && <TableCell>Shop</TableCell>}
              <TableCell align="right">Small Bags (200g)</TableCell>
              <TableCell align="right">Large Bags (1kg)</TableCell>
              <TableCell align="right">Total Quantity (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((item, index) => (
              <TableRow 
                key={`${item.name}_${item.grade}_${item.shopId || 'default'}_${index}`} 
                hover
                sx={{
                  backgroundColor: showShopInfo && !aggregateAcrossShops && index > 0 && 
                    summaryData[index-1].shopName !== item.shopName ? 
                    '#fafafa' : 'inherit'
                }}
              >
                <TableCell><strong>{item.name}</strong></TableCell>
                <TableCell>{item.grade}</TableCell>
                {showShopInfo && !aggregateAcrossShops && <TableCell>{item.shopName}</TableCell>}
                <TableCell align="right">{item.smallBags}</TableCell>
                <TableCell align="right">{item.largeBags}</TableCell>
                <TableCell align="right">{item.totalKg.toFixed(2)} kg</TableCell>
              </TableRow>
            ))}
            
            {/* Totals row */}
            <TableRow sx={{ 
              backgroundColor: '#f5f5f5', 
              '& .MuiTableCell-root': { 
                fontWeight: 'bold',
                borderTop: '2px solid #e0e0e0' 
              }
            }}>
              <TableCell colSpan={showShopInfo && !aggregateAcrossShops ? 3 : 2}>
                <Typography variant="subtitle2">TOTAL</Typography>
              </TableCell>
              <TableCell align="right">{totals.smallBags}</TableCell>
              <TableCell align="right">{totals.largeBags}</TableCell>
              <TableCell align="right">{totals.totalKg.toFixed(2)} kg</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 