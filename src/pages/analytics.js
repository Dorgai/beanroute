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
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import IconlessAlert from '../components/ui/IconlessAlert';

export default function Analytics() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
  
  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyticsData();
    }
  }, [startDate, endDate]);
  
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
            Delivered Orders Analytics
          </Typography>
          
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
                    <TableCell>Coffee Grade</TableCell>
                    <TableCell align="right">Small Bags (250g)</TableCell>
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
        </Paper>
      </Container>
    </>
  );
} 