import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from '@/lib/session';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';

export default function InventoryAlerts() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [alertLogs, setAlertLogs] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settings, setSettings] = useState(null);

  // Check if user is admin or owner
  const isAdminOrOwner = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';

  // Fetch alert logs
  useEffect(() => {
    if (!session) return;

    const fetchAlertLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/retail/alert-logs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch alert logs');
        }
        
        const data = await response.json();
        setAlertLogs(data.logs || []);
        
        // Get settings if they exist
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.frequency) {
            setFrequency(data.settings.frequency);
          }
        }
      } catch (err) {
        console.error('Error fetching alert logs:', err);
        setError('Failed to load alert logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertLogs();
  }, [session]);

  // Handle schedule update
  const handleUpdateSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/retail/schedule-inventory-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frequency }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      setSuccessMessage(`Schedule updated to ${frequency}. ${data.lastCheck?.alertsSent?.length || 0} emails sent in latest check.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual check
  const handleManualCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/retail/check-inventory-alerts');
      
      if (!response.ok) {
        throw new Error('Failed to run inventory check');
      }
      
      const data = await response.json();
      setSuccessMessage(`Inventory check completed. ${data.alertsSent.length} emails sent.`);
      
      // Refresh alert logs
      const logsResponse = await fetch('/api/retail/alert-logs');
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAlertLogs(logsData.logs || []);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error running inventory check:', err);
      setError('Failed to run inventory check. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a test alert (for debugging)
  const handleCreateTestAlert = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get a valid shop ID from the shops API
      const shopsResponse = await fetch('/api/retail/shops');
      if (!shopsResponse.ok) {
        throw new Error('Failed to fetch shops');
      }
      
      const shopsData = await shopsResponse.json();
      if (!shopsData || shopsData.length === 0) {
        throw new Error('No shops available for testing');
      }
      
      // Use the first available shop
      const testShopId = shopsData[0].id;
      
      const response = await fetch('/api/retail/log-inventory-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: testShopId,
          alertType: "WARNING",
          totalSmallBags: 5,
          totalLargeBags: 2,
          minSmallBags: 10,
          minLargeBags: 5,
          smallBagsPercentage: 50,
          largeBagsPercentage: 40
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test alert');
      }
      
      const data = await response.json();
      setSuccessMessage('Test alert created successfully.');
      
      // Refresh alert logs
      const logsResponse = await fetch('/api/retail/alert-logs');
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAlertLogs(logsData.logs || []);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error creating test alert:', err);
      setError('Failed to create test alert. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  // If not admin or owner, show access denied
  if (!isAdminOrOwner) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom color="error">
            Access Denied
          </Typography>
          <Typography>
            You do not have permission to view this page. Only administrators and owners can access inventory alert settings.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Inventory Alerts - Bean Route</title>
      </Head>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Inventory Alert Settings
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControl sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel id="frequency-label">Check Frequency</InputLabel>
              <Select
                labelId="frequency-label"
                value={frequency}
                label="Check Frequency"
                onChange={(e) => setFrequency(e.target.value)}
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpdateSchedule}
              disabled={loading}
            >
              Update Schedule
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleManualCheck}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              Run Manual Check Now
            </Button>
            
            <Button 
              variant="outlined" 
              color="info" 
              onClick={handleCreateTestAlert}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              Create Test Alert
            </Button>
            
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Box>
          
          {settings && (
            <Typography variant="body2" color="textSecondary">
              Last updated: {format(new Date(JSON.parse(settings.value).lastUpdated), 'MMM d, yyyy h:mm a')}
              {JSON.parse(settings.value).updatedBy !== 'system' && ' by user'}
            </Typography>
          )}
        </Paper>
        
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Alert History
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : alertLogs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No alert logs found. Try creating a test alert or running a manual check.
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                If you believe this is an error, check your database connection and SMTP settings.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Shop</TableCell>
                    <TableCell>Alert Type</TableCell>
                    <TableCell>Small Bags</TableCell>
                    <TableCell>Large Bags</TableCell>
                    <TableCell>Emails Sent</TableCell>
                    <TableCell>Recipients</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell>{log.shop.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.alertType} 
                          color={log.alertType === 'CRITICAL' ? 'error' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {log.totalSmallBags} / {log.minSmallBags} 
                        ({Math.round(log.smallBagsPercentage)}%)
                      </TableCell>
                      <TableCell>
                        {log.totalLargeBags} / {log.minLargeBags}
                        ({Math.round(log.largeBagsPercentage)}%)
                      </TableCell>
                      <TableCell>
                        {log.emailsSent ? (
                          <Chip label="Sent" color="success" size="small" />
                        ) : (
                          <Chip label="Not Sent" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {log.notifiedUsers.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </>
  );
} 