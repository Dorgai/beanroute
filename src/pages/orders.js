import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/session';
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { format } from 'date-fns';

// Simple Order Dialog Component
function OrderDialog({ open, onClose, coffeeItems, selectedShop }) {
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Reset order items when dialog opens with defensive checks
    if (open && Array.isArray(coffeeItems) && coffeeItems.length > 0) {
      const initialItems = {};
      coffeeItems.forEach(coffee => {
        if (coffee && coffee.id) {
          initialItems[coffee.id] = { smallBags: 0, largeBags: 0 };
        }
      });
      setOrderItems(initialItems);
      setValidationErrors({});
    } else if (open) {
      // If coffeeItems is not a valid array or is empty
      console.warn('No valid coffee items available for ordering');
    }
  }, [open, coffeeItems]);
  
  // Calculate total quantity for a coffee item in kg
  const calculateTotalQuantity = (smallBags, largeBags) => {
    return (smallBags * 0.25) + (largeBags * 1.0);
  };
  
  // Validate if the requested quantity is within available limits
  const validateQuantity = (coffeeId, smallBags, largeBags) => {
    const coffee = coffeeItems.find(c => c.id === coffeeId);
    if (!coffee) return true; // Can't validate if coffee not found
    
    const requestedQuantity = calculateTotalQuantity(smallBags, largeBags);
    const isValid = coffee.quantity >= requestedQuantity;
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [coffeeId]: isValid ? null : `Exceeds available quantity (${coffee.quantity}kg)`
    }));
    
    return isValid;
  };

  const handleQuantityChange = (coffeeId, field, value) => {
    if (!coffeeId) {
      console.warn('Invalid coffeeId in handleQuantityChange');
      return;
    }
    
    const numValue = parseInt(value) || 0;
    const currentValues = orderItems[coffeeId] || { smallBags: 0, largeBags: 0 };
    const updatedValues = {
      ...currentValues,
      [field]: numValue
    };
    
    setOrderItems(prev => ({
      ...prev,
      [coffeeId]: updatedValues
    }));
    
    // Validate after updating
    validateQuantity(coffeeId, 
      field === 'smallBags' ? numValue : updatedValues.smallBags,
      field === 'largeBags' ? numValue : updatedValues.largeBags
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate shop selection
      if (!selectedShop) {
        setError('Please select a shop');
        setLoading(false);
        return;
      }

      // Defensive check for orderItems
      if (!orderItems || typeof orderItems !== 'object') {
        setError('Invalid order data');
        setLoading(false);
        return;
      }

      // Filter out items with no quantity
      const items = Object.entries(orderItems)
        .filter(([coffeeId, item]) => {
          // Validate that coffeeId exists and item is valid
          if (!coffeeId || !item) return false;
          return (item.smallBags > 0 || item.largeBags > 0);
        })
        .map(([coffeeId, item]) => ({
          coffeeId,
          smallBags: item.smallBags || 0,
          largeBags: item.largeBags || 0
        }));

      if (items.length === 0) {
        setError('Please add at least one item to the order');
        setLoading(false);
        return;
      }
      
      // Check for any validation errors before submitting
      const hasValidationErrors = Object.values(validationErrors).some(error => error !== null);
      if (hasValidationErrors) {
        setError('Please correct the quantity errors before submitting');
        setLoading(false);
        return;
      }

      // Create the order
      const response = await fetch('/api/retail/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: selectedShop,
          items
        }),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Extract specific error information from the response
        let errorMessage = responseData.error || 'Failed to create order';
        
        // Check for insufficient quantity errors which contain specific coffee information
        if (errorMessage.includes('Insufficient quantity for coffee')) {
          // Format the error message to be more user-friendly
          const matches = errorMessage.match(/Insufficient quantity for coffee (.*?) \(ID: (.*?)\)\. Available: (.*?)kg, Requested: (.*?)kg/);
          if (matches && matches.length >= 5) {
            const [_, coffeeName, coffeeId, available, requested] = matches;
            errorMessage = `Not enough coffee available: ${coffeeName} - Available: ${available}kg, You requested: ${requested}kg`;
            
            // Add suggestions for the user
            const availableInKg = parseFloat(available);
            const maxLargeBags = Math.floor(availableInKg);
            const maxSmallBags = Math.floor(availableInKg / 0.25);
            
            errorMessage += `\n\nYou can order up to:
- ${maxLargeBags} large bags (1kg each)
- ${maxSmallBags} small bags (250g each)
- Or a combination that totals ${availableInKg}kg or less`;
          }
        } else if (responseData.details) {
          // Include additional error details if available
          errorMessage += `: ${responseData.details}`;
        }
        
        throw new Error(errorMessage);
      }

      onClose(true); // Pass true to indicate successful order
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>Create Order</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Order Information</Typography>
          <ul style={{ paddingLeft: '20px', margin: '0' }}>
            <li>Small bags = 250g each (0.25kg)</li>
            <li>Large bags = 1kg each</li>
            <li>Orders cannot exceed available coffee quantity</li>
            <li>Enter the number of bags you want to order</li>
          </ul>
        </Alert>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                whiteSpace: 'pre-line' // Preserve line breaks in error messages
              }
            }}
          >
            <Typography variant="subtitle2" gutterBottom>Error Creating Order</Typography>
            {error}
          </Alert>
        )}
        
        {!Array.isArray(coffeeItems) || coffeeItems.length === 0 ? (
          <Alert severity="info">No coffee available for ordering</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Coffee</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Small Bags (250g)</TableCell>
                  <TableCell>Large Bags (1kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coffeeItems.map((coffee) => coffee && coffee.id ? (
                  <TableRow key={coffee.id} hover>
                    <TableCell>
                      <strong>{coffee.name || 'Unknown'}</strong> 
                      <Typography variant="caption" color="text.secondary" display="block">
                        {coffee.grade ? coffee.grade.replace('_', ' ') : 'Unknown grade'}
                      </Typography>
                    </TableCell>
                    <TableCell>{typeof coffee.quantity === 'number' ? `${coffee.quantity} kg` : 'Unknown'}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        value={orderItems[coffee.id]?.smallBags || 0}
                        onChange={(e) => handleQuantityChange(coffee.id, 'smallBags', e.target.value)}
                        size="small"
                        fullWidth
                        error={Boolean(validationErrors[coffee.id])}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        value={orderItems[coffee.id]?.largeBags || 0}
                        onChange={(e) => handleQuantityChange(coffee.id, 'largeBags', e.target.value)}
                        size="small"
                        fullWidth
                        error={Boolean(validationErrors[coffee.id])}
                      />
                      {validationErrors[coffee.id] && (
                        <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                          {validationErrors[coffee.id]}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2, pb: 2 }}>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={
            loading || 
            !selectedShop || 
            !Array.isArray(coffeeItems) || 
            coffeeItems.length === 0 ||
            Object.values(validationErrors).some(error => error !== null)
          }
        >
          {loading ? 'Creating...' : 'Create Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Order Status Update Dialog Component
function StatusUpdateDialog({ open, onClose, order }) {
  const { session } = useSession();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  // Get user role
  const userRole = session?.user?.role || '';
  const isRoaster = userRole === 'ROASTER';
  const isRetailer = userRole === 'RETAILER';
  const isBarista = userRole === 'BARISTA';
  const isAdmin = userRole === 'ADMIN';
  const isOwner = userRole === 'OWNER';
  
  console.log('StatusUpdateDialog - Current user role:', userRole, 'isAdmin:', isAdmin, 'isOwner:', isOwner);

  useEffect(() => {
    // Reset status when dialog opens with defensive check
    if (open && order && order.status) {
      setStatus(order.status);
      console.log(`Setting initial status to: ${order.status}`);
    } else if (open && order) {
      // Default to PENDING if no status is provided
      setStatus('PENDING');
      console.warn('Order has no status, defaulting to PENDING');
    }
  }, [open, order]);

  // Get valid next statuses based on user role and current status
  const getValidNextStatuses = () => {
    if (!order) return [];
    
    const allPossibleStatuses = ['PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    
    // Admin and Owner can do any status change
    if (isAdmin || isOwner) {
      return allPossibleStatuses;
    }
    
    const currentStatus = order.status;
    
    if (isRoaster) {
      // Roasters can update PENDING to CONFIRMED to ROASTED to DISPATCHED
      const allowedTransitions = {
        'PENDING': ['CONFIRMED'],
        'CONFIRMED': ['ROASTED'],
        'ROASTED': ['DISPATCHED'],
        'DISPATCHED': [], // Roasters cannot change from DISPATCHED status
        'DELIVERED': [],
        'CANCELLED': []
      };
      return allowedTransitions[currentStatus] || [];
    } 
    else if (userRole === 'RETAILER') {
      // Retailers can change DISPATCHED to DELIVERED or CANCELLED, and can CANCEL from any status
      const allowedTransitions = {
        'PENDING': ['CANCELLED'],
        'CONFIRMED': ['CANCELLED'],
        'ROASTED': ['CANCELLED'],
        'DISPATCHED': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': [],
        'CANCELLED': []
      };
      return allowedTransitions[currentStatus] || [];
    }
    else if (userRole === 'BARISTA') {
      // Baristas can change DISPATCHED to DELIVERED only
      const allowedTransitions = {
        'PENDING': [],
        'CONFIRMED': [],
        'ROASTED': [],
        'DISPATCHED': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': []
      };
      return allowedTransitions[currentStatus] || [];
    }
    
    // Default empty array if no role matches
    return [];
  };

  const handleSubmit = async () => {
    // Validate order exists and has an ID
    if (!order || !order.id) {
      setError('Invalid order data');
      return;
    }
    
    // Validate status
    if (!status) {
      setError('Please select a status');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setApiResponse(null);

      // Log the order and status being submitted
      console.log(`Submitting status update: Order ID ${order.id}, Status ${status}`);

      const response = await fetch('/api/retail/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        setApiResponse(responseData);
        throw new Error(responseData.error || 'Failed to update order status');
      }

      console.log('Order status updated successfully');
      onClose(true); // Pass true to indicate successful update
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get valid next statuses
  const validNextStatuses = getValidNextStatuses();

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
        Update Order Status
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            {apiResponse && process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                API Response: {JSON.stringify(apiResponse, null, 2)}
              </Typography>
            )}
          </Alert>
        )}
        
        {!order && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No order data available
          </Alert>
        )}
        
        {order && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Order #{order.id ? order.id.substring(0, 8) : 'Unknown'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Shop: {order.shop?.name || 'Unknown'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current Status: <b>{order.status ? order.status.charAt(0) + order.status.slice(1).toLowerCase() : 'Unknown'}</b>
            </Typography>
            <Typography variant="body2" gutterBottom>
              Created: {order.createdAt 
                ? format(new Date(order.createdAt), 'MMM d, yyyy HH:mm') 
                : 'Unknown date'}
            </Typography>
            
            {validNextStatuses.length === 0 && (isRoaster || isRetailer || isBarista) && (
              <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
                You cannot change the status of this order from its current state: {order.status}
              </Alert>
            )}
            
            <Box sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => {
                    console.log(`Status changed to: ${e.target.value}`);
                    setStatus(e.target.value);
                  }}
                  label="Status"
                  disabled={(isRoaster || isRetailer || isBarista) && validNextStatuses.length === 0}
                >
                  {validNextStatuses.map((statusValue) => (
                    <MenuItem key={statusValue} value={statusValue}>
                      {statusValue.charAt(0) + statusValue.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2, pb: 2 }}>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={
            loading || 
            !order || 
            !order.id || 
            !status || 
            ((isRoaster || isRetailer || isBarista) && validNextStatuses.length === 0)
          }
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Status chip component for displaying order status with appropriate colors
function StatusChip({ status }) {
  let color = 'default';
  let tooltip = '';
  
  switch (status) {
    case 'PENDING':
      color = 'warning';
      tooltip = 'Order is pending confirmation. Coffee is reserved.';
      break;
    case 'CONFIRMED':
      color = 'info';
      tooltip = 'Order is confirmed. Coffee is reserved.';
      break;
    case 'ROASTED':
      color = 'secondary';
      tooltip = 'Coffee has been roasted. Ready for dispatch.';
      break;
    case 'DISPATCHED':
      color = 'primary';
      tooltip = 'Order has been dispatched. Awaiting delivery.';
      break;
    case 'DELIVERED':
      color = 'success';
      tooltip = 'Order has been delivered. Inventory has been updated.';
      break;
    case 'CANCELLED':
      color = 'error';
      tooltip = 'Order has been cancelled. Reserved coffee has been returned to inventory.';
      break;
    default:
      color = 'default';
      tooltip = 'Unknown status';
  }
  
  return (
    <Tooltip title={tooltip}>
      <Chip 
        label={status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown'} 
        color={color} 
        size="small" 
        sx={{ fontWeight: 500 }}
      />
    </Tooltip>
  );
}

export default function RetailOrders() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [inventory, setInventory] = useState([]);
  const [availableCoffee, setAvailableCoffee] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [recentlyChangedOrders, setRecentlyChangedOrders] = useState([]);
  
  // Check user role for conditional UI elements
  const userRole = session?.user?.role || '';
  const isRoaster = userRole === 'ROASTER';
  const isRetailer = userRole === 'RETAILER';
  const isBarista = userRole === 'BARISTA';
  const isAdmin = userRole === 'ADMIN';
  const isOwner = userRole === 'OWNER';
  
  // Should show pending orders alert for certain user roles
  const shouldShowPendingAlert = isRoaster || isAdmin || isOwner;
  
  // Should show changed orders alert for certain user roles
  const shouldShowChangedOrdersAlert = isRetailer || isAdmin || isOwner;
  
  // Toggle expanded state of a row
  const toggleRowExpanded = (orderId) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Check for stored shop preference
  useEffect(() => {
    const storedShopId = localStorage.getItem('selectedShopId');
    if (storedShopId) {
      setSelectedShop(storedShopId);
    }
  }, []);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/retail/shops');
        if (!response.ok) {
          throw new Error(`Failed to fetch shops (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Shops data received:', data);
        
        // Ensure shops is always an array
        const shopArray = Array.isArray(data) ? data : [];
        setShops(shopArray);
        
        if (shopArray.length > 0 && !selectedShop) {
          const shopId = shopArray[0].id;
          setSelectedShop(shopId);
          localStorage.setItem('selectedShopId', shopId);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops');
      }
    };

    fetchShops();
  }, []);

  // Fetch inventory and available coffee when shop changes
  useEffect(() => {
    if (!selectedShop) return;
    
    // Store selected shop in localStorage for persistence
    localStorage.setItem('selectedShopId', selectedShop);
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch inventory data
        let inventoryResponse;
        try {
          console.log('Fetching inventory for shop:', selectedShop);
          inventoryResponse = await fetch(`/api/retail/inventory?shopId=${selectedShop}`);
          if (!inventoryResponse.ok) {
            throw new Error(`Failed to fetch inventory (${inventoryResponse.status})`);
          }
        } catch (err) {
          console.error('Error fetching inventory:', err);
          setError('Failed to load inventory. Please try again later.');
          setLoading(false);
          return;
        }

        // Process inventory data with defensive coding
        try {
          const inventoryData = await inventoryResponse.json();
          console.log('Inventory API response:', inventoryData);
          
          if (!inventoryData || typeof inventoryData !== 'object') {
            console.error('Invalid inventory data format:', inventoryData);
            setInventory([]);
          } else {
            const flatInventory = Object.values(inventoryData).flat().filter(Boolean);
            console.log('Processed inventory:', flatInventory);
            setInventory(Array.isArray(flatInventory) ? flatInventory : []);
          }
        } catch (jsonError) {
          console.error('Error parsing inventory JSON:', jsonError);
          setInventory([]);
        }
        
        // Fetch orders for the selected shop
        try {
          console.log('Fetching orders for shop:', selectedShop);
          const ordersResponse = await fetch(`/api/retail/orders?shopId=${selectedShop}`);
          if (!ordersResponse.ok) {
            throw new Error(`Failed to fetch orders (${ordersResponse.status})`);
          }
          
          try {
            const ordersData = await ordersResponse.json();
            console.log('Orders API response:', ordersData);
            
            if (!Array.isArray(ordersData)) {
              console.warn('Orders data is not an array:', ordersData);
              setOrders([]);
            } else {
              setOrders(ordersData.filter(Boolean)); // Filter out null/undefined items
            }
          } catch (jsonError) {
            console.error('Error parsing orders JSON:', jsonError);
            setOrders([]);
          }
        } catch (err) {
          console.error('Error fetching orders:', err);
          setOrders([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedShop]);
  
  // Fetch available coffee separately
  useEffect(() => {
    const fetchAvailableCoffee = async () => {
      try {
        console.log('Fetching available coffee');
        const coffeeResponse = await fetch('/api/retail/available-coffee');
        if (!coffeeResponse.ok) {
          throw new Error(`Failed to fetch available coffee (${coffeeResponse.status})`);
        }
        
        try {
          const coffeeData = await coffeeResponse.json();
          console.log('Available coffee API response:', coffeeData);
          
          if (!coffeeData || typeof coffeeData !== 'object') {
            console.error('Invalid coffee data format:', coffeeData);
            setAvailableCoffee([]);
          } else {
            const flatCoffee = Object.values(coffeeData).flat().filter(Boolean);
            console.log('Processed coffee:', flatCoffee);
            setAvailableCoffee(Array.isArray(flatCoffee) ? flatCoffee : []);
          }
        } catch (jsonError) {
          console.error('Error parsing coffee JSON:', jsonError);
          setAvailableCoffee([]);
        }
      } catch (err) {
        console.error('Error fetching available coffee:', err);
        setAvailableCoffee([]);
      }
    };
    
    fetchAvailableCoffee();
  }, []);

  // Process orders to check for pending orders and recent changes
  useEffect(() => {
    if (!orders || !orders.length) return;
    
    // Check for pending orders
    const pendingOrders = orders.filter(order => order.status === 'PENDING');
    setHasPendingOrders(pendingOrders.length > 0);
    
    // Check for orders that changed since last login
    // Using localStorage to store last login time as a simple solution
    const lastLoginTime = localStorage.getItem('lastOrderCheckTime');
    const currentTime = new Date().toISOString();
    
    // If we have a last login time, check for orders updated since then
    if (lastLoginTime) {
      const changedOrders = orders.filter(order => {
        return order.updatedAt && new Date(order.updatedAt) > new Date(lastLoginTime);
      });
      setRecentlyChangedOrders(changedOrders);
    }
    
    // Update the last check time
    localStorage.setItem('lastOrderCheckTime', currentTime);
  }, [orders]);

  const handleCreateOrder = () => {
    setOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = (success) => {
    setOrderDialogOpen(false);
    if (success) {
      // Refresh data after successful order
      refreshData();
    }
  };
  
  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };
  
  const handleCloseStatusDialog = (success) => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    if (success) {
      // Refresh orders after status update
      refreshData();
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  const refreshData = async () => {
    if (!selectedShop) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch inventory with error handling
      try {
        console.log('Refreshing inventory for shop:', selectedShop);
        const inventoryResponse = await fetch(`/api/retail/inventory?shopId=${selectedShop}`);
        
        if (!inventoryResponse.ok) {
          console.error('Error response from inventory API:', inventoryResponse.status);
        } else {
          try {
            const inventoryData = await inventoryResponse.json();
            const flatInventory = inventoryData && typeof inventoryData === 'object'
              ? Object.values(inventoryData).flat().filter(Boolean)
              : [];
            setInventory(flatInventory);
          } catch (jsonError) {
            console.error('Error parsing inventory JSON:', jsonError);
          }
        }
      } catch (error) {
        console.error('Error refreshing inventory:', error);
      }
      
      // Fetch orders with error handling
      try {
        console.log('Refreshing orders for shop:', selectedShop);
        const ordersResponse = await fetch(`/api/retail/orders?shopId=${selectedShop}`);
        
        if (!ordersResponse.ok) {
          console.error('Error response from orders API:', ordersResponse.status);
        } else {
          try {
            const ordersData = await ordersResponse.json();
            setOrders(Array.isArray(ordersData) ? ordersData.filter(Boolean) : []);
          } catch (jsonError) {
            console.error('Error parsing orders JSON:', jsonError);
          }
        }
      } catch (error) {
        console.error('Error refreshing orders:', error);
      }
      
      // Refresh available coffee with error handling
      try {
        console.log('Refreshing available coffee');
        const coffeeResponse = await fetch('/api/retail/available-coffee');
        
        if (!coffeeResponse.ok) {
          console.error('Error response from available coffee API:', coffeeResponse.status);
        } else {
          try {
            const coffeeData = await coffeeResponse.json();
            const flatCoffee = coffeeData && typeof coffeeData === 'object'
              ? Object.values(coffeeData).flat().filter(Boolean)
              : [];
            setAvailableCoffee(flatCoffee);
          } catch (jsonError) {
            console.error('Error parsing coffee JSON:', jsonError);
          }
        }
      } catch (error) {
        console.error('Error refreshing available coffee:', error);
      }
    } catch (error) {
      console.error('Unhandled error in refreshData:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Retail Orders - Bean Route</title>
      </Head>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Retail Management
            </Typography>
            <Box>
              <Tooltip title="Refresh Data">
                <IconButton onClick={refreshData} sx={{ mr: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {!isRoaster && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateOrder}
                  size="medium"
                >
                  New Order
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Alert for pending orders */}
          {shouldShowPendingAlert && hasPendingOrders && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Attention: There are pending orders that need your review!
              </Typography>
              <Typography variant="body2">
                {isRoaster ? 
                  'Please review these orders.' : 
                  'There are orders waiting for review.'}
              </Typography>
            </Alert>
          )}
          
          {/* Alert for recently changed orders */}
          {shouldShowChangedOrdersAlert && recentlyChangedOrders.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Order Updates Since Your Last Visit
              </Typography>
              <Typography variant="body2">
                {recentlyChangedOrders.length} {recentlyChangedOrders.length === 1 ? 'order has' : 'orders have'} been updated.
              </Typography>
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Shop</InputLabel>
            <Select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              label="Shop"
              size="small"
            >
              {Array.isArray(shops) && shops.length > 0 ? (
                shops.map((shop) => (
                  <MenuItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No shops available</MenuItem>
              )}
            </Select>
          </FormControl>
          
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                aria-label="retail management tabs"
              >
                <Tab label="Inventory" id="tab-0" />
                <Tab label="Orders" id="tab-1" />
              </Tabs>
            </Box>
            
            {/* Inventory Tab */}
            <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography>Loading inventory...</Typography>
                </Box>
              ) : inventory.length === 0 ? (
                <Alert severity="info">No inventory data available for this shop</Alert>
              ) : (
                <Paper elevation={1}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Coffee</TableCell>
                          <TableCell>Grade</TableCell>
                          <TableCell align="right">Small Bags (250g)</TableCell>
                          <TableCell align="right">Large Bags (1kg)</TableCell>
                          <TableCell align="right">Total Quantity (kg)</TableCell>
                          <TableCell>Last Order Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventory.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell><strong>{item.coffee?.name || 'Unknown'}</strong></TableCell>
                            <TableCell>{item.coffee?.grade?.replace('_', ' ') || 'Unknown'}</TableCell>
                            <TableCell align="right">{item.smallBags || 0}</TableCell>
                            <TableCell align="right">{item.largeBags || 0}</TableCell>
                            <TableCell align="right">{item.totalQuantity ? item.totalQuantity.toFixed(2) : '0.00'}</TableCell>
                            <TableCell>
                              {item.lastOrderDate
                                ? format(new Date(item.lastOrderDate), 'MMM d, yyyy')
                                : 'Never'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
            
            {/* Orders Tab */}
            <Box role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography>Loading orders...</Typography>
                </Box>
              ) : orders.length === 0 ? (
                <Alert severity="info">No orders available for this shop</Alert>
              ) : (
                <Paper elevation={1}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell>Order ID</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Ordered By</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Total Quantity</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((order) => (
                          <React.Fragment key={order.id}>
                            <TableRow hover>
                              <TableCell padding="checkbox">
                                <IconButton
                                  size="small"
                                  onClick={() => toggleRowExpanded(order.id)}
                                  aria-label="expand row"
                                >
                                  {expandedRows[order.id] ? (
                                    <KeyboardArrowUpIcon />
                                  ) : (
                                    <KeyboardArrowDownIcon />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell>{order.id.substring(0, 8)}</TableCell>
                              <TableCell>
                                {order.createdAt 
                                  ? format(new Date(order.createdAt), 'MMM d, yyyy') 
                                  : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <StatusChip status={order.status} />
                              </TableCell>
                              <TableCell>
                                {order.orderedBy?.firstName 
                                  ? `${order.orderedBy.firstName} ${order.orderedBy.lastName || ''}` 
                                  : order.orderedBy?.username || 'Unknown'}
                              </TableCell>
                              <TableCell>{order.items?.length || 0}</TableCell>
                              <TableCell>
                                {order.items?.reduce((sum, item) => sum + (item.totalQuantity || 0), 0).toFixed(2)} kg
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Update Status">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleOpenStatusDialog(order)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                            {expandedRows[order.id] && Array.isArray(order.items) && order.items.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={8} sx={{ py: 0 }}>
                                  <Box sx={{ margin: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Order Details
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Coffee</TableCell>
                                          <TableCell>Grade</TableCell>
                                          <TableCell align="right">Small Bags (250g)</TableCell>
                                          <TableCell align="right">Large Bags (1kg)</TableCell>
                                          <TableCell align="right">Total Quantity</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {order.items.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell>
                                              {item.coffee?.name || 'Unknown Coffee'}
                                            </TableCell>
                                            <TableCell>
                                              {item.coffee?.grade?.replace('_', ' ') || 'Unknown'}
                                            </TableCell>
                                            <TableCell align="right">{item.smallBags || 0}</TableCell>
                                            <TableCell align="right">{item.largeBags || 0}</TableCell>
                                            <TableCell align="right">{item.totalQuantity?.toFixed(2) || '0.00'} kg</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          </Box>
        </Paper>
        
        {/* Dialogs */}
        <OrderDialog 
          open={orderDialogOpen} 
          onClose={handleCloseOrderDialog}
          coffeeItems={availableCoffee}
          selectedShop={selectedShop}
        />
        
        <StatusUpdateDialog
          open={statusDialogOpen}
          onClose={handleCloseStatusDialog}
          order={selectedOrder}
        />
      </Container>
    </>
  );
} 