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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Email as EmailIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function InventoryAlerts() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [alertLogs, setAlertLogs] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settings, setSettings] = useState(null);
  
  // Email notification states
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [shops, setShops] = useState([]);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [editingEmailNotification, setEditingEmailNotification] = useState(null);

  // Email form state
  const [emailFormData, setEmailFormData] = useState({
    shopId: '',
    alertType: 'ALL',
    emails: [''],
    isEnabled: true
  });

  const alertTypes = [
    { value: 'ALL', label: 'All Alerts', color: '#2196f3' },
    { value: 'WARNING', label: 'Warning Only', color: '#ff9800' },
    { value: 'CRITICAL', label: 'Critical Only', color: '#f44336' }
  ];

  // Check if user is admin or owner
  const isAdminOrOwner = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';

  // Fetch alert logs and email notifications
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch alert logs
        const alertResponse = await fetch('/api/retail/alert-logs');
        if (!alertResponse.ok) {
          throw new Error('Failed to fetch alert logs');
        }
        const alertData = await alertResponse.json();
        setAlertLogs(alertData.logs || []);
        
        // Get settings if they exist
        if (alertData.settings) {
          setSettings(alertData.settings);
          if (alertData.settings.frequency) {
            setFrequency(alertData.settings.frequency);
          }
        }

        // Fetch email notifications and shops with fallback mechanism
        try {
          const emailResponse = await fetch('/api/admin/inventory-email-notifications');
          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            setEmailNotifications(emailData.notifications || []);
            setShops(emailData.shops || []);
          } else {
            throw new Error('Main API failed');
          }
        } catch (mainApiError) {
          // Fallback: Main API failed, use alternative approach
          console.log('Main API failed, using fallback approach...', mainApiError.message);
          
          // Fetch shops separately (this works)
          try {
            const shopsResponse = await fetch('/api/retail/shops');
            if (shopsResponse.ok) {
              const shopsData = await shopsResponse.json();
              setShops(shopsData || []);
              console.log('Fallback shops fetch successful:', shopsData?.length || 0);
            }
          } catch (shopsError) {
            console.error('Fallback shops fetch failed:', shopsError);
          }

          // Use direct database query to fetch notifications (bypassing Prisma)
          try {
            const directResponse = await fetch('/api/debug/check-inventory-table');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              if (directData.success && directData.notifications && directData.notifications.data) {
                // Transform the raw data to match expected format
                const transformedNotifications = directData.notifications.data.map(n => ({
                  id: n.id,
                  shopId: n.shopId,
                  alertType: n.alertType,
                  emails: n.emails,
                  isEnabled: n.isEnabled,
                  shop: directData.shops?.data?.find(s => s.id === n.shopId) || null,
                  createdBy: { username: 'admin' } // Placeholder since we can't fetch user details
                }));
                setEmailNotifications(transformedNotifications);
                console.log('Direct query fetch successful:', transformedNotifications.length);
              }
            }
          } catch (directError) {
            console.error('Direct query fetch also failed:', directError);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Email notification functions
  const handleAddEmailNotification = () => {
    setEditingEmailNotification(null);
    setEmailFormData({
      shopId: '',
      alertType: 'ALL',
      emails: [''],
      isEnabled: true
    });
    setOpenEmailDialog(true);
  };

  const handleEditEmailNotification = (notification) => {
    setEditingEmailNotification(notification);
    setEmailFormData({
      shopId: notification.shopId || '',
      alertType: notification.alertType,
      emails: [...notification.emails],
      isEnabled: notification.isEnabled
    });
    setOpenEmailDialog(true);
  };

  const handleDeleteEmailNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this email notification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/inventory-email-notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete email notification');
      }

      setSuccessMessage('Email notification deleted successfully');
      // Refresh data
      const emailResponse = await fetch('/api/admin/inventory-email-notifications');
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setEmailNotifications(emailData.notifications || []);
      }
    } catch (err) {
      console.error('Error deleting email notification:', err);
      setError(err.message);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const validEmails = emailFormData.emails.filter(email => email.trim() !== '');
      if (validEmails.length === 0) {
        throw new Error('At least one email address is required');
      }

      const requestData = {
        shopId: emailFormData.shopId || null,
        alertType: emailFormData.alertType,
        emails: validEmails,
        isEnabled: emailFormData.isEnabled
      };

      const url = editingEmailNotification 
        ? `/api/admin/inventory-email-notifications/${editingEmailNotification.id}`
        : '/api/admin/inventory-email-notifications';
      
      const method = editingEmailNotification ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save email notification');
      }

      const successText = editingEmailNotification 
        ? 'Email notification updated successfully'
        : 'Email notification created successfully';
      
      setSuccessMessage(successText);
      setOpenEmailDialog(false);
      
      // Refresh data
      const emailResponse = await fetch('/api/admin/inventory-email-notifications');
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setEmailNotifications(emailData.notifications || []);
      }
    } catch (err) {
      console.error('Error saving email notification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = () => {
    setEmailFormData(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  const handleRemoveEmail = (index) => {
    if (emailFormData.emails.length > 1) {
      setEmailFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }));
    }
  };

  const handleEmailChange = (index, value) => {
    setEmailFormData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }));
  };

  const getAlertTypeColor = (alertType) => {
    const alertConfig = alertTypes.find(a => a.value === alertType);
    return alertConfig ? alertConfig.color : '#6c757d';
  };

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'All Shops';
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
        
        {/* Email Notifications Section */}
        <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Email Notifications
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddEmailNotification}
              disabled={loading}
            >
              Add Email Notification
            </Button>
          </Box>

          {emailNotifications.length === 0 ? (
            <Typography color="textSecondary">
              No email notifications configured. Click "Add Email Notification" to set up email alerts.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {emailNotifications.map((notification) => (
                <Grid item xs={12} md={6} lg={4} key={notification.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {getShopName(notification.shopId)}
                        </Typography>
                        <Chip
                          label={notification.alertType}
                          size="small"
                          sx={{ 
                            backgroundColor: getAlertTypeColor(notification.alertType),
                            color: 'white'
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {notification.emails.length} email{notification.emails.length !== 1 ? 's' : ''}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {notification.emails.join(', ')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={notification.isEnabled ? 'Enabled' : 'Disabled'}
                          color={notification.isEnabled ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="caption" color="textSecondary">
                          Created {format(new Date(notification.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEmailNotification(notification)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEmailNotification(notification.id)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
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

        {/* Email Notification Dialog */}
        <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingEmailNotification ? 'Edit Email Notification' : 'Add Email Notification'}
          </DialogTitle>
          <form onSubmit={handleEmailSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Shop</InputLabel>
                    <Select
                      value={emailFormData.shopId}
                      onChange={(e) => setEmailFormData(prev => ({ ...prev, shopId: e.target.value }))}
                      label="Shop"
                    >
                      <MenuItem value="">All Shops</MenuItem>
                      {shops.length === 0 ? (
                        <MenuItem disabled>No shops available</MenuItem>
                      ) : (
                        shops.map((shop) => (
                          <MenuItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Alert Type</InputLabel>
                    <Select
                      value={emailFormData.alertType}
                      onChange={(e) => setEmailFormData(prev => ({ ...prev, alertType: e.target.value }))}
                      label="Alert Type"
                    >
                      {alertTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Email Addresses
                  </Typography>
                  {emailFormData.emails.map((email, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TextField
                        fullWidth
                        type="email"
                        label={`Email ${index + 1}`}
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        required={index === 0}
                        margin="normal"
                      />
                      {emailFormData.emails.length > 1 && (
                        <IconButton
                          onClick={() => handleRemoveEmail(index)}
                          color="error"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddEmail}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add Email
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailFormData.isEnabled}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                      />
                    }
                    label="Enable notifications"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEmailDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (editingEmailNotification ? 'Update' : 'Create')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </>
  );
} 