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
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function OrderEmailNotifications() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    shopId: '',
    orderStatus: 'PENDING',
    emails: [''],
    isEnabled: true
  });

  // Check if user is admin or owner
  const isAdminOrOwner = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';

  const orderStatuses = [
    { value: 'PENDING', label: 'Pending', color: '#ff9800' },
    { value: 'CONFIRMED', label: 'Confirmed', color: '#2196f3' },
    { value: 'ROASTED', label: 'Roasted', color: '#9c27b0' },
    { value: 'DISPATCHED', label: 'Dispatched', color: '#3f51b5' },
    { value: 'DELIVERED', label: 'Delivered', color: '#4caf50' },
    { value: 'CANCELLED', label: 'Cancelled', color: '#f44336' }
  ];

  // Fetch data
  useEffect(() => {
    if (!session || !isAdminOrOwner) return;
    fetchData();
  }, [session, isAdminOrOwner]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shops and email notifications
      const [shopsResponse, notificationsResponse] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/admin/order-email-notifications')
      ]);

      if (!shopsResponse.ok || !notificationsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const shopsData = await shopsResponse.json();
      const notificationsData = await notificationsResponse.json();

      setShops(shopsData.shops || []);
      setEmailNotifications(notificationsData.notifications || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (notification = null) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        shopId: notification.shopId,
        orderStatus: notification.orderStatus,
        emails: notification.emails || [''],
        isEnabled: notification.isEnabled
      });
    } else {
      setEditingNotification(null);
      setFormData({
        shopId: '',
        orderStatus: 'PENDING',
        emails: [''],
        isEnabled: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const addEmailField = () => {
    setFormData({ ...formData, emails: [...formData.emails, ''] });
  };

  const removeEmailField = (index) => {
    const newEmails = formData.emails.filter((_, i) => i !== index);
    setFormData({ ...formData, emails: newEmails });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validate form
      if (!formData.shopId || !formData.orderStatus) {
        setError('Please select a shop and order status');
        return;
      }

      const validEmails = formData.emails.filter(email => email.trim() && email.includes('@'));
      if (validEmails.length === 0) {
        setError('Please provide at least one valid email address');
        return;
      }

      const url = editingNotification 
        ? `/api/admin/order-email-notifications/${editingNotification.id}`
        : '/api/admin/order-email-notifications';
      
      const method = editingNotification ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          emails: validEmails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save email notification');
      }

      setSuccessMessage(editingNotification ? 'Email notification updated successfully' : 'Email notification created successfully');
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving email notification:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this email notification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/order-email-notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete email notification');
      }

      setSuccessMessage('Email notification deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting email notification:', err);
      setError(err.message);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setError(null);
      
      const response = await fetch('/api/admin/test-email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: session.user.email || 'admin@example.com'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }

      setSuccessMessage('Test email sent successfully! Check your inbox.');
    } catch (err) {
      console.error('Error sending test email:', err);
      setError(err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = orderStatuses.find(s => s.value === status);
    return statusConfig ? statusConfig.color : '#6c757d';
  };

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  if (!session) {
    return null;
  }

  if (!isAdminOrOwner) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom color="error">
            Access Denied
          </Typography>
          <Typography>
            You do not have permission to view this page. Only administrators and owners can access email notification settings.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Order Email Notifications - Bean Route</title>
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

        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                Order Email Notifications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure email notifications for order status changes per shop. 
                Set up which email addresses should be notified when orders change status.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                >
                  {testingEmail ? 'Sending...' : 'Test Email'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Notification
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Email Notifications Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Email Notification Settings
          </Typography>
          
          {emailNotifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No email notifications configured
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add your first email notification to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Notification
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Shop</TableCell>
                    <TableCell>Order Status</TableCell>
                    <TableCell>Email Addresses</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emailNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getShopName(notification.shopId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.orderStatus}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(notification.orderStatus),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          {notification.emails.map((email, index) => (
                            <Chip
                              key={index}
                              label={email}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.isEnabled ? 'Enabled' : 'Disabled'}
                          size="small"
                          color={notification.isEnabled ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(notification)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingNotification ? 'Edit Email Notification' : 'Add Email Notification'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Shop</InputLabel>
                    <Select
                      value={formData.shopId}
                      onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                      label="Shop"
                    >
                      {shops.map((shop) => (
                        <MenuItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Order Status</InputLabel>
                    <Select
                      value={formData.orderStatus}
                      onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                      label="Order Status"
                    >
                      {orderStatuses.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: status.color
                              }}
                            />
                            {status.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Email Addresses
                  </Typography>
                  {formData.emails.map((email, index) => (
                    <Box key={index} display="flex" gap={1} mb={1}>
                      <TextField
                        fullWidth
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        size="small"
                      />
                      {formData.emails.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEmailField(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addEmailField}
                  >
                    Add Another Email
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      />
                    }
                    label="Enable notifications"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingNotification ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}





