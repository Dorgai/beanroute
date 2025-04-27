import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from '@/lib/session';
import { useRouter } from 'next/router';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import IconlessAlert from '../components/ui/IconlessAlert';

// Import chart components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Analytics() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  
  // State for the original analytics
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for the weekly orders analytics
  const [weeklyData, setWeeklyData] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('all');
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState(null);
  const [weeksToShow, setWeeksToShow] = useState(8);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // If switching to weekly tab and no data yet, fetch it
    if (newValue === 1 && weeklyData.length === 0) {
      fetchWeeklyData();
    }
  };
  
  // Check user role access
  useEffect(() => {
    if (!sessionLoading && session) {
      const userRole = session.user.role;
      // Only allow ADMIN, OWNER and RETAILER to access this page
      if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'RETAILER') {
        router.push('/orders');
      }
    }
  }, [session, sessionLoading, router]);
  
  // Set default dates on initial load
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd\'T\'HH:mm'));
    setEndDate(format(now, 'yyyy-MM-dd\'T\'HH:mm'));
  }, []);
  
  const fetchAnalyticsData = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/delivered-orders?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWeeklyData = async () => {
    try {
      setWeeklyLoading(true);
      setWeeklyError(null);
      
      const response = await fetch(`/api/analytics/weekly-delivered-orders?weeks=${weeksToShow}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly analytics data');
      }
      
      const data = await response.json();
      setWeeklyData(data.weeklyData || []);
      setShops(data.shops || []);
      
      // Default to 'all' shops
      setSelectedShop('all');
    } catch (err) {
      console.error('Error fetching weekly analytics data:', err);
      setWeeklyError(err.message || 'An error occurred while fetching weekly data');
    } finally {
      setWeeklyLoading(false);
    }
  };
  
  // Handle shop selection change
  const handleShopChange = (event) => {
    setSelectedShop(event.target.value);
  };
  
  // Handle weeks to show change
  const handleWeeksChange = (event) => {
    const newValue = parseInt(event.target.value, 10);
    setWeeksToShow(newValue);
    // Reload data with new week count
    if (tabValue === 1) {
      fetchWeeklyData();
    }
  };
  
  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyticsData();
    }
  }, [startDate, endDate]);
  
  // Prepare chart data for small bags by shop and grade
  const getSmallBagsByShopChartData = () => {
    if (weeklyData.length === 0) return null;
    
    const labels = weeklyData.map(week => week.weekLabel);
    const datasets = [];
    
    // If all shops selected or specific shop doesn't exist, show aggregated data
    if (selectedShop === 'all') {
      // Add datasets for each grade
      datasets.push({
        label: 'Specialty Small Bags',
        data: weeklyData.map(week => week.aggregated.smallBags.SPECIALTY),
        backgroundColor: 'rgba(75, 192, 192, 0.7)'
      });
      datasets.push({
        label: 'Premium Small Bags',
        data: weeklyData.map(week => week.aggregated.smallBags.PREMIUM),
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      });
      datasets.push({
        label: 'Rarity Small Bags',
        data: weeklyData.map(week => week.aggregated.smallBags.RARITY),
        backgroundColor: 'rgba(255, 159, 64, 0.7)'
      });
    } else {
      // Show data for the selected shop
      weeklyData.forEach(week => {
        const shopData = week.byShop[selectedShop];
        if (shopData) {
          if (!datasets.length) {
            // Initialize datasets
            datasets.push({
              label: 'Specialty Small Bags',
              data: [shopData.smallBags.SPECIALTY],
              backgroundColor: 'rgba(75, 192, 192, 0.7)'
            });
            datasets.push({
              label: 'Premium Small Bags',
              data: [shopData.smallBags.PREMIUM],
              backgroundColor: 'rgba(54, 162, 235, 0.7)'
            });
            datasets.push({
              label: 'Rarity Small Bags',
              data: [shopData.smallBags.RARITY],
              backgroundColor: 'rgba(255, 159, 64, 0.7)'
            });
          } else {
            // Add data to existing datasets
            datasets[0].data.push(shopData.smallBags.SPECIALTY);
            datasets[1].data.push(shopData.smallBags.PREMIUM);
            datasets[2].data.push(shopData.smallBags.RARITY);
          }
        }
      });
    }
    
    return { labels, datasets };
  };
  
  // Prepare chart data for large bags by shop and grade
  const getLargeBagsByShopChartData = () => {
    if (weeklyData.length === 0) return null;
    
    const labels = weeklyData.map(week => week.weekLabel);
    const datasets = [];
    
    // If all shops selected or specific shop doesn't exist, show aggregated data
    if (selectedShop === 'all') {
      // Add datasets for each grade
      datasets.push({
        label: 'Specialty Large Bags',
        data: weeklyData.map(week => week.aggregated.largeBags.SPECIALTY),
        backgroundColor: 'rgba(153, 102, 255, 0.7)'
      });
      datasets.push({
        label: 'Premium Large Bags',
        data: weeklyData.map(week => week.aggregated.largeBags.PREMIUM),
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      });
      datasets.push({
        label: 'Rarity Large Bags',
        data: weeklyData.map(week => week.aggregated.largeBags.RARITY),
        backgroundColor: 'rgba(255, 206, 86, 0.7)'
      });
    } else {
      // Show data for the selected shop
      weeklyData.forEach(week => {
        const shopData = week.byShop[selectedShop];
        if (shopData) {
          if (!datasets.length) {
            // Initialize datasets
            datasets.push({
              label: 'Specialty Large Bags',
              data: [shopData.largeBags.SPECIALTY],
              backgroundColor: 'rgba(153, 102, 255, 0.7)'
            });
            datasets.push({
              label: 'Premium Large Bags',
              data: [shopData.largeBags.PREMIUM],
              backgroundColor: 'rgba(255, 99, 132, 0.7)'
            });
            datasets.push({
              label: 'Rarity Large Bags',
              data: [shopData.largeBags.RARITY],
              backgroundColor: 'rgba(255, 206, 86, 0.7)'
            });
          } else {
            // Add data to existing datasets
            datasets[0].data.push(shopData.largeBags.SPECIALTY);
            datasets[1].data.push(shopData.largeBags.PREMIUM);
            datasets[2].data.push(shopData.largeBags.RARITY);
          }
        }
      });
    }
    
    return { labels, datasets };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
  
  // If session is loading or user doesn't have access, show loading or nothing
  if (sessionLoading || (session && (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER' && session.user.role !== 'RETAILER'))) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <>
      <Head>
        <title>Analytics - Bean Route</title>
      </Head>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Coffee Sales Analytics
          </Typography>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="analytics tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Delivered Orders Summary" id="analytics-tab-0" />
            <Tab label="Weekly Delivered Orders Charts" id="analytics-tab-1" />
          </Tabs>
          
          {/* Tab 1: Original Analytics */}
          <TabPanel value={tabValue} index={0}>
            {error && (
              <IconlessAlert severity="error" sx={{ mb: 2 }}>
                {error}
              </IconlessAlert>
            )}
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
              <TextField
                label="End Date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
              <Button 
                variant="contained" 
                onClick={fetchAnalyticsData}
                disabled={loading || !startDate || !endDate}
              >
                {loading ? 'Loading...' : 'Update Report'}
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Coffee</TableCell>
                      <TableCell>Origin</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell align="right">Small Bags (200g)</TableCell>
                      <TableCell align="right">Large Bags (1kg)</TableCell>
                      <TableCell align="right">Total Orders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData && analyticsData.length > 0 ? (
                      analyticsData.map((row) => (
                        <TableRow key={row.grade} hover>
                          <TableCell component="th" scope="row">
                            <strong>{row.grade}</strong>
                          </TableCell>
                          <TableCell>{row.origin}</TableCell>
                          <TableCell>{row.grade}</TableCell>
                          <TableCell align="right">{row.smallBags}</TableCell>
                          <TableCell align="right">{row.largeBags}</TableCell>
                          <TableCell align="right">{row.orderCount}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No delivered orders found in the selected date range
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
          
          {/* Tab 2: Weekly Charts */}
          <TabPanel value={tabValue} index={1}>
            {weeklyError && (
              <IconlessAlert severity="error" sx={{ mb: 2 }}>
                {weeklyError}
              </IconlessAlert>
            )}
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="shop-select-label">Select Shop</InputLabel>
                <Select
                  labelId="shop-select-label"
                  id="shop-select"
                  value={selectedShop}
                  label="Select Shop"
                  onChange={handleShopChange}
                  disabled={weeklyLoading}
                >
                  <MenuItem value="all">All Shops (Aggregated)</MenuItem>
                  {shops.map((shop) => (
                    <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="weeks-select-label">Weeks to Show</InputLabel>
                <Select
                  labelId="weeks-select-label"
                  id="weeks-select"
                  value={weeksToShow}
                  label="Weeks to Show"
                  onChange={handleWeeksChange}
                  disabled={weeklyLoading}
                >
                  <MenuItem value={4}>4 Weeks</MenuItem>
                  <MenuItem value={8}>8 Weeks</MenuItem>
                  <MenuItem value={12}>12 Weeks</MenuItem>
                  <MenuItem value={26}>26 Weeks</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                onClick={fetchWeeklyData}
                disabled={weeklyLoading}
              >
                {weeklyLoading ? 'Loading...' : 'Update Charts'}
              </Button>
            </Box>
            
            {weeklyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : weeklyData.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No weekly data available. Click 'Update Charts' to load data.</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Shop-specific or aggregated charts */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedShop === 'all' 
                        ? 'Weekly Small Bags Delivery by Grade (All Shops)' 
                        : `Weekly Small Bags Delivery by Grade (${shops.find(s => s.id === selectedShop)?.name || 'Selected Shop'})`}
                    </Typography>
                    <Box sx={{ height: 400, p: 1 }}>
                      {getSmallBagsByShopChartData() ? (
                        <Bar 
                          data={getSmallBagsByShopChartData()} 
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              title: {
                                display: true,
                                text: 'Small Bags (200g) Distribution'
                              }
                            }
                          }} 
                        />
                      ) : (
                        <Typography align="center">No data available for the selected shop</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedShop === 'all' 
                        ? 'Weekly Large Bags Delivery by Grade (All Shops)' 
                        : `Weekly Large Bags Delivery by Grade (${shops.find(s => s.id === selectedShop)?.name || 'Selected Shop'})`}
                    </Typography>
                    <Box sx={{ height: 400, p: 1 }}>
                      {getLargeBagsByShopChartData() ? (
                        <Bar 
                          data={getLargeBagsByShopChartData()} 
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              title: {
                                display: true,
                                text: 'Large Bags (1kg) Distribution'
                              }
                            }
                          }} 
                        />
                      ) : (
                        <Typography align="center">No data available for the selected shop</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </>
  );
} 