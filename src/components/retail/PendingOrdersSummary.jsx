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
  Box,
  Button
} from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Constants for bag sizes in kg
const SMALL_BAG_SIZE = 0.2; // 200g
const MEDIUM_BAG_SIZE = 0.5; // 500g
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
    if (!Array.isArray(orders)) {
      console.error('Expected orders to be an array, received:', orders);
      return [];
    }
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
          
          // Handle both old and new data structure for backward compatibility
          const smallBags = item.smallBags || 0;
          const espressoBags = item.smallBagsEspresso || 0;
          const filterBags = item.smallBagsFilter || 0;
          const largeBags = item.largeBags || 0;
          const mediumEspressoBags = item.mediumBagsEspresso || 0;
          const mediumFilterBags = item.mediumBagsFilter || 0;
          
          // For backward compatibility: if no espresso/filter data, treat smallBags as espresso
          let actualEspressoBags = espressoBags;
          let actualFilterBags = filterBags;
          let totalSmallBags = espressoBags + filterBags;
          const totalMediumBags = mediumEspressoBags + mediumFilterBags;
          
          if (smallBags > 0 && espressoBags === 0 && filterBags === 0) {
            // Old data structure - treat all smallBags as espresso for backward compatibility
            actualEspressoBags = smallBags;
            actualFilterBags = 0;
            totalSmallBags = smallBags;
          }
          
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
              smallBagsEspresso: 0,
              smallBagsFilter: 0,
              mediumBags: 0,
              mediumBagsEspresso: 0,
              mediumBagsFilter: 0,
              largeBags: 0,
              totalKg: 0,
              espressoKg: 0,
              filterKg: 0,
              mediumKg: 0
            };
          }
          
          // Add to the aggregated data
          aggregatedData[key].smallBags += totalSmallBags;
          aggregatedData[key].smallBagsEspresso += actualEspressoBags;
          aggregatedData[key].smallBagsFilter += actualFilterBags;
          aggregatedData[key].largeBags += largeBags;
          aggregatedData[key].mediumBags += totalMediumBags;
          aggregatedData[key].mediumBagsEspresso += mediumEspressoBags;
          aggregatedData[key].mediumBagsFilter += mediumFilterBags;
          
          // Calculate total in kg (using the correct small bag size of 200g)
          const totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (totalMediumBags * MEDIUM_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
          const espressoKg = actualEspressoBags * SMALL_BAG_SIZE;
          const filterKg = actualFilterBags * SMALL_BAG_SIZE;
          const mediumKg = totalMediumBags * MEDIUM_BAG_SIZE;
          
          aggregatedData[key].totalKg += totalKg;
          aggregatedData[key].espressoKg += espressoKg;
          aggregatedData[key].filterKg += filterKg;
          aggregatedData[key].mediumKg += mediumKg;
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
        smallBagsEspresso: acc.smallBagsEspresso + item.smallBagsEspresso,
        smallBagsFilter: acc.smallBagsFilter + item.smallBagsFilter,
        mediumBags: acc.mediumBags + (item.mediumBags || 0),
        mediumBagsEspresso: acc.mediumBagsEspresso + (item.mediumBagsEspresso || 0),
        mediumBagsFilter: acc.mediumBagsFilter + (item.mediumBagsFilter || 0),
        largeBags: acc.largeBags + item.largeBags,
        totalKg: acc.totalKg + item.totalKg,
        espressoKg: acc.espressoKg + item.espressoKg,
        filterKg: acc.filterKg + item.filterKg,
        mediumKg: acc.mediumKg + (item.mediumKg || 0)
      };
    }, { smallBags: 0, smallBagsEspresso: 0, smallBagsFilter: 0, mediumBags: 0, mediumBagsEspresso: 0, mediumBagsFilter: 0, largeBags: 0, totalKg: 0, espressoKg: 0, filterKg: 0, mediumKg: 0 });
  }, [summaryData]);

  // Calculate shop subtotals for shop breakdown view
  const shopSubtotals = useMemo(() => {
    if (!showShopInfo || aggregateAcrossShops) return {};
    
    const subtotals = {};
    summaryData.forEach(item => {
      const shopKey = item.shopName;
      if (!subtotals[shopKey]) {
        subtotals[shopKey] = {
          smallBags: 0,
          smallBagsEspresso: 0,
          smallBagsFilter: 0,
          largeBags: 0,
          totalKg: 0,
          espressoKg: 0,
          filterKg: 0
        };
      }
      
      subtotals[shopKey].smallBags += item.smallBags;
      subtotals[shopKey].smallBagsEspresso += item.smallBagsEspresso;
      subtotals[shopKey].smallBagsFilter += item.smallBagsFilter;
      subtotals[shopKey].largeBags += item.largeBags;
      subtotals[shopKey].totalKg += item.totalKg;
      subtotals[shopKey].espressoKg += item.espressoKg;
      subtotals[shopKey].filterKg += item.filterKg;
    });
    
    return subtotals;
  }, [summaryData, showShopInfo, aggregateAcrossShops]);

  // Function to handle Excel export
  const handleExport = () => {
    // Prepare data for export
    const exportData = summaryData.map(item => ({
      'Coffee Name': item.name,
      'Grade': item.grade,
      ...(showShopInfo && !aggregateAcrossShops ? { 'Shop': item.shopName } : {}),
      'Large Bags (1kg)': item.largeBags,
      'Medium Bags (500g)': item.mediumBags || 0,
      'Small Bags (200g)': item.smallBags,
      'Espresso Bags (200g)': item.smallBagsEspresso,
      'Filter Bags (200g)': item.smallBagsFilter,
      'Medium (kg)': (item.mediumKg || 0).toFixed(2),
      'Espresso (kg)': item.espressoKg.toFixed(2),
      'Filter (kg)': item.filterKg.toFixed(2),
      'Total Quantity (kg)': item.totalKg.toFixed(2)
    }));

    // Add totals row
    exportData.push({
      'Coffee Name': 'TOTAL',
      'Grade': '',
      ...(showShopInfo && !aggregateAcrossShops ? { 'Shop': '' } : {}),
      'Large Bags (1kg)': totals.largeBags,
      'Medium Bags (500g)': totals.mediumBags,
      'Small Bags (200g)': totals.smallBags,
      'Espresso Bags (200g)': totals.smallBagsEspresso,
      'Filter Bags (200g)': totals.smallBagsFilter,
      'Medium (kg)': (totals.mediumKg || 0).toFixed(2),
      'Espresso (kg)': totals.espressoKg.toFixed(2),
      'Filter (kg)': totals.filterKg.toFixed(2),
      'Total Quantity (kg)': totals.totalKg.toFixed(2)
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Orders');

    // Generate Excel file
    XLSX.writeFile(wb, 'pending_orders_summary.xlsx');
  };

  // If there are no pending orders, don't render anything
  if (pendingOrders.length === 0 || summaryData.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4, mt: 2 }}>
      {!hideHeader && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <div>
              <Typography variant="h6" gutterBottom>
                Pending Orders Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This table summarizes all pending orders, grouped by coffee type.
              </Typography>
            </div>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              sx={{ ml: 2 }}
            >
              Export to Excel
            </Button>
          </Box>
        </>
      )}
      
      <TableContainer component={Paper} variant="outlined" sx={{
        bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
        border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
      }}>
        <Table>
          <TableHead sx={{ 
            backgroundColor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5'
          }}>
            <TableRow>
              <TableCell sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Coffee</TableCell>
              <TableCell sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Grade</TableCell>
              {showShopInfo && !aggregateAcrossShops && <TableCell sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Shop</TableCell>}
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Large Bags (1kg)</TableCell>
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Medium Bags (500g)</TableCell>
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Small Bags (200g)</TableCell>
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Espresso (kg)</TableCell>
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Filter (kg)</TableCell>
              <TableCell align="right" sx={{
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}>Total Quantity (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((item, index) => {
              const isNewShop = showShopInfo && !aggregateAcrossShops && index > 0 && 
                summaryData[index-1].shopName !== item.shopName;
              const isLastItemForShop = showShopInfo && !aggregateAcrossShops && 
                (index === summaryData.length - 1 || summaryData[index + 1].shopName !== item.shopName);
              
              return (
                <React.Fragment key={`${item.name}_${item.grade}_${item.shopId || 'default'}_${index}`}>
                  <TableRow 
                    hover
                    sx={{
                      backgroundColor: isNewShop ? '#fafafa' : 'inherit',
                      borderTop: isNewShop ? '2px solid #e0e0e0' : 'none'
                    }}
                  >
                    <TableCell><strong>{item.name}</strong></TableCell>
                    <TableCell>{item.grade}</TableCell>
                    {showShopInfo && !aggregateAcrossShops && <TableCell>{item.shopName}</TableCell>}
                    <TableCell align="right">{item.largeBags}</TableCell>
                    <TableCell align="right">{item.mediumBags || 0}</TableCell>
                    <TableCell align="right">
                      {item.smallBags}
                      {item.smallBags > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          (E: {item.smallBagsEspresso}, F: {item.smallBagsFilter})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.espressoKg.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {item.filterKg.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">{item.totalKg.toFixed(2)} kg</TableCell>
                  </TableRow>
                  
                  {/* Shop subtotal row */}
                  {isLastItemForShop && showShopInfo && !aggregateAcrossShops && (
                    <TableRow sx={{ 
                      backgroundColor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f8f9fa', 
                      '& .MuiTableCell-root': { 
                        fontWeight: 'bold',
                        borderTop: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #dee2e6',
                        fontStyle: 'italic',
                        color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit'
                      }
                    }}>
                      <TableCell colSpan={3}>
                        <Typography variant="subtitle2" color="primary">
                          {item.shopName} Subtotal
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{shopSubtotals[item.shopName]?.largeBags || 0}</TableCell>
                      <TableCell align="right">{shopSubtotals[item.shopName]?.mediumBags || 0}</TableCell>
                      <TableCell align="right">
                        {shopSubtotals[item.shopName]?.smallBags || 0}
                        {(shopSubtotals[item.shopName]?.smallBags || 0) > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            (E: {shopSubtotals[item.shopName]?.smallBagsEspresso || 0}, F: {shopSubtotals[item.shopName]?.smallBagsFilter || 0})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {(shopSubtotals[item.shopName]?.espressoKg || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {(shopSubtotals[item.shopName]?.filterKg || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{(shopSubtotals[item.shopName]?.totalKg || 0).toFixed(2)} kg</TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Totals row */}
            <TableRow sx={{ 
              backgroundColor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5', 
              '& .MuiTableCell-root': { 
                fontWeight: 'bold',
                borderTop: theme => theme.palette.mode === 'dark' ? '2px solid #6b7280' : '2px solid #e0e0e0',
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit'
              }
            }}>
              <TableCell colSpan={showShopInfo && !aggregateAcrossShops ? 3 : 2}>
                <Typography variant="subtitle2">TOTAL</Typography>
              </TableCell>
              <TableCell align="right">{totals.largeBags}</TableCell>
              <TableCell align="right">{totals.mediumBags}</TableCell>
              <TableCell align="right">
                {totals.smallBags}
                {totals.smallBags > 0 && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    (E: {totals.smallBagsEspresso}, F: {totals.smallBagsFilter})
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {totals.espressoKg.toFixed(2)}
              </TableCell>
              <TableCell align="right">
                {totals.filterKg.toFixed(2)}
              </TableCell>
              <TableCell align="right">{totals.totalKg.toFixed(2)} kg</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 