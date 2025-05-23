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
  Tooltip,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { format } from 'date-fns';
import InventoryUpdateDialog from '@/components/retail/InventoryUpdateDialog';
import IconlessAlert from '../components/ui/IconlessAlert';
import ShopStockSummary from '../components/retail/ShopStockSummary';
import PendingOrdersSummary from '../components/retail/PendingOrdersSummary';

// Simple Order Dialog Component
function OrderDialog({ open, onClose, coffeeItems, selectedShop }) {
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [comment, setComment] = useState('');

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
      setComment('');
    } else if (open) {
      // If coffeeItems is not a valid array or is empty
      console.warn('No valid coffee items available for ordering');
    }
  }, [open, coffeeItems]);
  
  // Calculate total quantity for a coffee item in kg
  const calculateTotalQuantity = (smallBags, largeBags) => {
    return (smallBags * 0.2) + (largeBags * 1.0);
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
      [coffeeId]: isValid ? null : `Exceeds available quantity (${coffee.quantity.toFixed(2)}kg)`
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
          items,
          comment: comment.trim()
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
            const [_, coffeeName, coffeeId, availableStr, requestedStr] = matches;
            const availableInKg = parseFloat(availableStr);
            const requestedInKg = parseFloat(requestedStr);
            
            const maxLargeBags = Math.floor(availableInKg);
            const maxSmallBags = Math.floor(availableInKg / 0.2);
            
            setError(`Insufficient quantity for ${coffeeName}. Available: ${availableInKg.toFixed(2)}kg, Requested: ${requestedInKg.toFixed(2)}kg. Maximum possible order:
            - ${maxLargeBags} large bags (1kg each)
            - ${maxSmallBags} small bags (200g each)`);
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
        <IconlessAlert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Order Information</Typography>
          <ul style={{ paddingLeft: '20px', margin: '0' }}>
            <li>Small bags = 200g each (0.2kg)</li>
            <li>Large bags = 1kg each</li>
            <li>Orders cannot exceed available coffee quantity</li>
            <li>Enter the number of bags you want to order</li>
          </ul>
        </IconlessAlert>
        
        {error && (
          <IconlessAlert 
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
          </IconlessAlert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Order Comment"
            multiline
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any special instructions or notes for this order (optional)"
            fullWidth
            inputProps={{ maxLength: 200 }}
            helperText={`${comment.length}/200 characters`}
          />
        </Box>
        
        {!Array.isArray(coffeeItems) || coffeeItems.length === 0 ? (
          <IconlessAlert severity="info">No coffee available for ordering</IconlessAlert>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Coffee</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Small Bags (200g)</TableCell>
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
                    <TableCell>{typeof coffee.quantity === 'number' ? `${coffee.quantity.toFixed(2)} kg` : 'Unknown'}</TableCell>
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
function StatusUpdateDialog({ open, onClose, order, refreshData }) {
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
      console.log('Status update response:', responseData);
      
      if (!response.ok) {
        setApiResponse(responseData);
        throw new Error(responseData.error || 'Failed to update order status');
      }

      console.log('Order status updated successfully');
      
      // Force a refresh of the data
      if (typeof refreshData === 'function') {
        setTimeout(() => {
          refreshData();
        }, 500);
      } else {
        console.warn('refreshData is not a function, skipping refresh');
      }
      
      // Pass the updated status back to the parent component
      onClose(true, status); // Pass true to indicate successful update along with the new status
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
          <IconlessAlert severity="error" sx={{ mb: 2 }}>
            {error}
            {apiResponse && process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                API Response: {JSON.stringify(apiResponse, null, 2)}
              </Typography>
            )}
          </IconlessAlert>
        )}
        
        {!order && (
          <IconlessAlert severity="warning" sx={{ mb: 2 }}>
            No order data available
          </IconlessAlert>
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
            
            {order.comment && (
              <Box sx={{ mt: 1, mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Comment:
                </Typography>
                <Typography variant="body2">
                  {order.comment}
                </Typography>
              </Box>
            )}
            
            {validNextStatuses.length === 0 && (isRoaster || isRetailer || isBarista) && (
              <IconlessAlert severity="info" sx={{ mt: 2, mb: 1 }}>
                You cannot change the status of this order from its current state: {order.status}
              </IconlessAlert>
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

// Stock Level Alert component
function StockLevelAlert({ inventory, shopMinQuantities, coffeeCount }) {
  if (!inventory || !shopMinQuantities) return null;
  
  // Use the coffeeCount prop with fallback to 1
  const numberOfCoffees = coffeeCount || 1;

  // Calculate per-coffee minimums
  const perCoffeeMinSmall = shopMinQuantities.minCoffeeQuantitySmall / numberOfCoffees;
  
  // Calculate percentage thresholds: below 75% is low, below 50% is critical
  const smallBagsPercentage = perCoffeeMinSmall > 0 ? 
                             (inventory.smallBags / perCoffeeMinSmall) * 100 : 100;
  
  // Determine if stock is low (below 75%) or critical (below 50%)
  const isSmallBagsLow = perCoffeeMinSmall > 0 && smallBagsPercentage < 75 && smallBagsPercentage >= 50;
  const isSmallBagsCritical = perCoffeeMinSmall > 0 && smallBagsPercentage < 50;
  
  // If no issues with this specific inventory item, don't show anything
  if (!isSmallBagsLow && !isSmallBagsCritical) {
    return (
      <Chip label="In Stock" color="success" size="small" />
    );
  }
  
  if (isSmallBagsCritical) {
    return (
      <Chip 
        label="Critical Low" 
        color="error" 
        size="small"
        icon={<ErrorIcon />} 
      />
    );
  }
  
  return (
    <Chip 
      label="Low Stock" 
      color="warning" 
      size="small"
      icon={<WarningIcon />} 
    />
  );
}

export default function RetailOrders() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedShopDetails, setSelectedShopDetails] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [inventoryHistoryLoading, setInventoryHistoryLoading] = useState(false);
  const [availableCoffee, setAvailableCoffee] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [recentlyChangedOrders, setRecentlyChangedOrders] = useState([]);
  const [recentAlertLogs, setRecentAlertLogs] = useState([]);
  const [checkingInventory, setCheckingInventory] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [allPendingOrders, setAllPendingOrders] = useState([]);
  const [allPendingOrdersLoading, setAllPendingOrdersLoading] = useState(false);
  
  // Check user role for conditional UI elements
  const userRole = session?.user?.role || '';
  const isRoaster = userRole === 'ROASTER';
  const isRetailer = userRole === 'RETAILER';
  const isBarista = userRole === 'BARISTA';
  const isAdmin = userRole === 'ADMIN';
  const isOwner = userRole === 'OWNER';
  
  // Check if the user can update inventory (retailer, barista, admin, owner)
  const canUpdateInventory = isRetailer || isBarista || isAdmin || isOwner;
  
  // Should show pending orders alert for certain user roles
  const shouldShowPendingAlert = isRoaster || isAdmin || isOwner;
  
  // Should show changed orders alert for certain user roles
  const shouldShowChangedOrdersAlert = isRetailer || isAdmin || isOwner;
  
  // For roaster users, always set the tab to Orders (index 0 for them)
  useEffect(() => {
    if (isRoaster) {
      setTabIndex(0); // For roasters, Orders is the only tab at index 0
    }
  }, [isRoaster]);

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
    const fetchShops = async (retryCount = 0, useDirectMode = false) => {
      try {
        console.log(`Attempting to fetch shops, attempt: ${retryCount + 1}${useDirectMode ? ' (direct mode)' : ''}`);
        
        // Construct URL with direct mode parameter if needed
        const url = useDirectMode 
          ? '/api/retail/shops?direct=true' 
          : '/api/retail/shops';
        
        const response = await fetch(url, {
          credentials: 'include', // Explicitly include credentials
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          // Log error details
          console.error(`Failed to fetch shops (${response.status})`);
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
          
          // Try direct mode if normal mode fails with authentication errors
          if (!useDirectMode && response.status === 401 && retryCount < 1) {
            console.log('Authentication failed, trying direct mode...');
            return fetchShops(retryCount, true);
          }
          
          // Retry logic for server errors
          if (response.status === 500 && retryCount < 3) {
            console.log(`Retrying fetch shops in ${(retryCount + 1) * 2} seconds...`);
            setTimeout(() => fetchShops(retryCount + 1, useDirectMode), (retryCount + 1) * 2000);
            return;
          }
          
          throw new Error(`Failed to fetch shops (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Shops data received:', data);
        
        // Ensure shops is always an array
        const shopArray = Array.isArray(data) ? data : [];
        
        // Save shops to localStorage as a fallback mechanism
        if (shopArray.length > 0) {
          try {
            localStorage.setItem('cachedShops', JSON.stringify(shopArray));
            console.log('Saved shops to localStorage cache');
          } catch (cacheError) {
            console.error('Failed to cache shops:', cacheError);
          }
        }
        
        setShops(shopArray);
        
        // If we have shop data and no selected shop, select the first one
        if (shopArray.length > 0 && !selectedShop) {
          const shopId = shopArray[0].id;
          setSelectedShop(shopId);
          localStorage.setItem('selectedShopId', shopId);
        } else if (shopArray.length === 0) {
          console.log('No shops returned from API, checking localStorage cache');
          
          // Try to get shops from localStorage if API returned empty
          try {
            const cachedShopsJson = localStorage.getItem('cachedShops');
            if (cachedShopsJson) {
              const cachedShops = JSON.parse(cachedShopsJson);
              if (Array.isArray(cachedShops) && cachedShops.length > 0) {
                console.log('Using cached shops from localStorage:', cachedShops.length);
                setShops(cachedShops);
                
                // If we still need to select a shop, use the first cached one
                if (!selectedShop) {
                  const shopId = cachedShops[0].id;
                  setSelectedShop(shopId);
                  localStorage.setItem('selectedShopId', shopId);
                }
                
                // Don't show error when using cached shops
                return;
              }
            }
          } catch (cacheError) {
            console.error('Error reading cached shops:', cacheError);
          }
          
          // Show error message only if we couldn't get shops from API or cache
          setError('No shops available. Please contact an administrator.');
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops. Please try refreshing the page.');
        
        // Try to get shops from localStorage as emergency fallback
        try {
          const cachedShopsJson = localStorage.getItem('cachedShops');
          if (cachedShopsJson) {
            const cachedShops = JSON.parse(cachedShopsJson);
            if (Array.isArray(cachedShops) && cachedShops.length > 0) {
              console.log('Using cached shops from localStorage as error fallback');
              setShops(cachedShops);
              
              // If we need to select a shop, use the first cached one
              if (!selectedShop) {
                const shopId = cachedShops[0].id;
                setSelectedShop(shopId);
                // Don't update localStorage here as it might overwrite a valid ID
              }
            }
          }
        } catch (cacheError) {
          console.error('Error reading cached shops during error recovery:', cacheError);
        }
      }
    };

    fetchShops();
  }, [selectedShop]);

  // Fetch shop details when the selected shop changes
  useEffect(() => {
    const fetchShopDetails = async () => {
      if (!selectedShop) return;
      
      try {
        console.log('Fetching shop details for:', selectedShop);
        const response = await fetch(`/api/shops/shop-details?id=${selectedShop}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shop details (${response.status})`);
        }
        
        const shopData = await response.json();
        console.log('Shop details:', shopData);
        setSelectedShopDetails(shopData);
      } catch (error) {
        console.error('Error fetching shop details:', error);
      }
    };
    
    fetchShopDetails();
  }, [selectedShop]);

  // Fetch inventory and available coffee when shop changes
  useEffect(() => {
    if (!selectedShop) return;
    
    // Store selected shop in localStorage for persistence
    localStorage.setItem('selectedShopId', selectedShop);
    
    const fetchData = async (useDirectMode = false) => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch inventory data
        let inventoryResponse;
        try {
          // Construct URL with direct mode parameter if needed
          const url = useDirectMode 
            ? `/api/retail/inventory?shopId=${selectedShop}&direct=true` 
            : `/api/retail/inventory?shopId=${selectedShop}`;
          
          console.log(`Fetching inventory for shop: ${selectedShop}${useDirectMode ? ' (direct mode)' : ''}`);
          inventoryResponse = await fetch(url, {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!inventoryResponse.ok) {
            if (!useDirectMode && inventoryResponse.status === 401) {
              console.log('Authentication failed for inventory, trying direct mode...');
              // Stop current attempt and retry with direct mode
              return fetchData(true);
            }
            
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
            
            // Cache inventory data for emergency fallback
            try {
              localStorage.setItem('cachedInventory', JSON.stringify(flatInventory));
              console.log('Saved inventory to localStorage cache');
            } catch (cacheError) {
              console.error('Failed to cache inventory:', cacheError);
            }
          }
        } catch (jsonError) {
          console.error('Error parsing inventory JSON:', jsonError);
          setInventory([]);
          
          // Try to load from cache as fallback
          try {
            const cachedInventoryJson = localStorage.getItem('cachedInventory');
            if (cachedInventoryJson) {
              const cachedInventory = JSON.parse(cachedInventoryJson);
              console.log('Using cached inventory as fallback');
              setInventory(cachedInventory);
            }
          } catch (cacheError) {
            console.error('Error reading cached inventory:', cacheError);
          }
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
        
        // Try to load cached data
        try {
          const cachedInventoryJson = localStorage.getItem('cachedInventory');
          if (cachedInventoryJson) {
            const cachedInventory = JSON.parse(cachedInventoryJson);
            console.log('Using cached inventory after error');
            setInventory(cachedInventory);
          }
        } catch (cacheError) {
          console.error('Error reading cached inventory during error recovery:', cacheError);
        }
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

  // Fetch inventory history when shop changes
  useEffect(() => {
    if (!selectedShop) return;
    
    const fetchInventoryHistory = async () => {
      setInventoryHistoryLoading(true);
      
      try {
        const response = await fetch(`/api/retail/inventory-history?shopId=${selectedShop}`);
        
        if (!response.ok) {
          console.error('Error response from inventory history API:', response.status);
          throw new Error(`Failed to fetch inventory history (${response.status})`);
        }
        
        const data = await response.json();
        setInventoryHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching inventory history:', error);
      } finally {
        setInventoryHistoryLoading(false);
      }
    };
    
    fetchInventoryHistory();
  }, [selectedShop]);

  // Fetch recent alert logs when shop changes
  useEffect(() => {
    if (!selectedShop || !(isAdmin || isOwner)) return;
    
    const fetchRecentAlertLogs = async () => {
      try {
        const response = await fetch('/api/retail/alert-logs');
        
        if (!response.ok) {
          console.error('Error response from alert logs API:', response.status);
          return;
        }
        
        const data = await response.json();
        // Filter logs for the selected shop
        const shopLogs = data.logs.filter(log => log.shop.id === selectedShop);
        setRecentAlertLogs(shopLogs);
      } catch (error) {
        console.error('Error fetching alert logs:', error);
      }
    };
    
    fetchRecentAlertLogs();
  }, [selectedShop, isAdmin, isOwner]);
  
  // Handle running a manual inventory check
  const handleRunInventoryCheck = async () => {
    if (!selectedShop) return;
    
    setCheckingInventory(true);
    setAlertMessage(null);
    
    try {
      const response = await fetch('/api/retail/check-inventory-alerts');
      
      if (!response.ok) {
        throw new Error('Failed to run inventory check');
      }
      
      const data = await response.json();
      
      // Get alerts for this shop
      const shopAlerts = data.alertsSent.filter(alert => alert.shopId === selectedShop);
      
      if (shopAlerts.length > 0) {
        setAlertMessage({
          type: 'success',
          text: `Inventory check completed. ${shopAlerts.length} alert${shopAlerts.length !== 1 ? 's' : ''} for this shop.`
        });
      } else {
        setAlertMessage({
          type: 'info',
          text: 'Inventory check completed. No alerts generated for this shop.'
        });
      }
      
      // Refresh alert logs
      const logsResponse = await fetch('/api/retail/alert-logs');
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        const shopLogs = logsData.logs.filter(log => log.shop.id === selectedShop);
        setRecentAlertLogs(shopLogs);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error running inventory check:', err);
      setAlertMessage({
        type: 'error',
        text: 'Failed to run inventory check. Please try again later.'
      });
    } finally {
      setCheckingInventory(false);
    }
  };

  const handleCreateOrder = () => {
    setOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = (success) => {
    setOrderDialogOpen(false);
    if (success) {
      // Refresh data after successful order
      fetchData();
    }
  };
  
  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };
  
  const handleCloseStatusDialog = (success, newStatus) => {
    const wasChangedToDelivered = newStatus === 'DELIVERED' && success;
    setSelectedOrder(null);
    setStatusDialogOpen(false);
    
    if (success) {
      fetchData();
      
      // If the order status was changed to DELIVERED and user is not a Roaster,
      // switch to the Inventory tab automatically since inventory will have been updated
      if (wasChangedToDelivered && !isRoaster) {
        // For non-roaster users, the Inventory tab is at index 0
        setTabIndex(0);
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    // For roaster users, only the Orders tab is visible and it's at index 0
    // For other users, the tabs are: 0=Inventory, 1=Inventory History, 2=Orders
    setTabIndex(newValue);
  };
  
  const handleOpenInventoryDialog = (inventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    setInventoryDialogOpen(true);
  };
  
  const handleCloseInventoryDialog = (success) => {
    setInventoryDialogOpen(false);
    setSelectedInventoryItem(null);
    if (success) {
      // Refresh inventory data after update
      fetchData();
    }
  };
  
  const fetchData = async () => {
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
      
      // Fetch inventory history with error handling
      try {
        console.log('Refreshing inventory history for shop:', selectedShop);
        const historyResponse = await fetch(`/api/retail/inventory-history?shopId=${selectedShop}`);
        
        if (!historyResponse.ok) {
          console.error('Error response from inventory history API:', historyResponse.status);
        } else {
          try {
            const historyData = await historyResponse.json();
            setInventoryHistory(Array.isArray(historyData) ? historyData : []);
          } catch (jsonError) {
            console.error('Error parsing inventory history JSON:', jsonError);
          }
        }
      } catch (error) {
        console.error('Error refreshing inventory history:', error);
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
            setOrders([]);
          }
        }
      } catch (error) {
        console.error('Error refreshing orders:', error);
        setOrders([]);
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

  // Fetch all pending orders across all shops
  useEffect(() => {
    const fetchAllPendingOrders = async () => {
      if (tabIndex !== getTabsForUserRole().length - 1) return; // Only fetch when on the Pending Orders tab
      
      try {
        setAllPendingOrdersLoading(true);
        const response = await fetch('/api/retail/orders?status=PENDING');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pending orders');
        }
        
        const data = await response.json();
        setAllPendingOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching all pending orders:', error);
      } finally {
        setAllPendingOrdersLoading(false);
      }
    };
    
    fetchAllPendingOrders();
  }, [tabIndex]);

  // Tabs for different users
  const getTabsForUserRole = () => {
    if (isRoaster) {
      return [
        { label: "Orders", id: "tab-0" },
        { label: "Pending Orders Summary", id: "tab-1" }
      ];
    } else if (isRetailer || isBarista) {
      return [
        { label: "Inventory", id: "tab-0" },
        { label: "Inventory History", id: "tab-1" },
        { label: "Orders", id: "tab-2" },
        { label: "Pending Orders Summary", id: "tab-3" }
      ];
    } else if (isAdmin || isOwner) {
      return [
        { label: "Inventory", id: "tab-0" },
        { label: "Inventory History", id: "tab-1" },
        { label: "Orders", id: "tab-2" },
        { label: "Pending Orders Summary", id: "tab-3" }
      ];
    }
    return [];
  };

  // Update global count variable whenever availableCoffee changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.availableCoffeeCount = availableCoffee.length || 1;
    }
  }, [availableCoffee]);

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Retail - Bean Route</title>
      </Head>
      
      {/* Debug for troubleshooting */}
      {console.log('DEBUG - ShopStockSummary values:', {
        isRoaster,
        loading,
        selectedShopDetails,
        inventoryExists: !!inventory,
        inventoryLength: inventory?.length || 0,
        shopDetailsExists: !!selectedShopDetails,
        shopDetailsName: selectedShopDetails?.name || 'none',
        minSmallBags: selectedShopDetails?.minCoffeeQuantitySmall || 'none',
        minLargeBags: selectedShopDetails?.minCoffeeQuantityLarge || 'none'
      })}
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Shop Stock Summary displayed prominently at the top - ALWAYS show for non-roasters if shop details exist */}
        {!isRoaster && selectedShopDetails && (
          <div>
            <Box sx={{ mb: 4, mt: 2 }}>
              <ShopStockSummary 
                inventory={inventory || []} 
                shopDetails={selectedShopDetails} 
                sx={{ 
                  mb: 3,
                  border: '2px solid #e0e0e0',
                  boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                }}
              />
              {/* Debug information */}
              {/* {console.log('DEBUG - ShopStockSummary Values:', {
                inventoryLength: inventory?.length,
                shopDetailsName: selectedShopDetails?.name,
                minSmallBags: selectedShopDetails?.minCoffeeQuantitySmall,
                minLargeBags: selectedShopDetails?.minCoffeeQuantityLarge,
                hasInventory: Boolean(inventory?.length)
              })} */}
            </Box>
          </div>
        )}
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              {isRoaster ? "Orders Management" : "Retail Management"}
            </Typography>
            <Box>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchData} sx={{ mr: 1 }}>
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
            <IconlessAlert severity="error" sx={{ mb: 2 }}>
              {error}
            </IconlessAlert>
          )}
          
          {/* Alert for pending orders */}
          {shouldShowPendingAlert && hasPendingOrders && (
            <IconlessAlert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Attention: There are pending orders that need your review!
              </Typography>
              <Typography variant="body2">
                {isRoaster ? 
                  'Please review these orders.' : 
                  'There are orders waiting for review.'}
              </Typography>
            </IconlessAlert>
          )}
          
          {/* Alert for recently changed orders */}
          {shouldShowChangedOrdersAlert && recentlyChangedOrders.length > 0 && (
            <IconlessAlert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Order Updates Since Your Last Visit
              </Typography>
              <Typography variant="body2">
                {recentlyChangedOrders.length} {recentlyChangedOrders.length === 1 ? 'order has' : 'orders have'} been updated.
              </Typography>
            </IconlessAlert>
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
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                {getTabsForUserRole().map((tab, index) => (
                  <Tab key={tab.id} label={tab.label} id={tab.id} />
                ))}
              </Tabs>
            </Box>
            
            {/* Inventory Tab - Only visible for non-roaster users */}
            {!isRoaster && (
              <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ py: 2 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography>Loading inventory...</Typography>
                  </Box>
                ) : inventory.length === 0 ? (
                  <IconlessAlert severity="info">No inventory data available for this shop</IconlessAlert>
                ) : (
                  <>
                    {/* Shop minimum quantities info alert */}
                    {selectedShopDetails && (canUpdateInventory || isAdmin || isOwner) && (
                      <IconlessAlert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Shop Minimum Inventory Requirements
                        </Typography>
                        <Typography variant="body2">
                          Small bags: {selectedShopDetails.minCoffeeQuantitySmall} |
                          Large bags: {selectedShopDetails.minCoffeeQuantityLarge} 
                        </Typography>
                      </IconlessAlert>
                    )}
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableRow>
                            {canUpdateInventory && (
                              <TableCell align="center">Actions</TableCell>
                            )}
                            <TableCell>Coffee</TableCell>
                            <TableCell>Grade</TableCell>
                            <TableCell align="right">Small Bags (200g)</TableCell>
                            <TableCell align="right">Large Bags (1kg)</TableCell>
                            <TableCell align="right">Total Quantity (kg)</TableCell>
                            <TableCell>Last Order Date</TableCell>
                            <TableCell>Stock Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inventory.map((item) => {
                            // Calculate stock status for row styling based only on small bags
                            // Get the actual number of available coffees instead of hardcoding to 2
                            const numberOfCoffees = availableCoffee.length || 1; // Use actual coffee count with fallback to 1
                            
                            // Calculate per-coffee minimums for small bags only
                            const perCoffeeMinSmall = selectedShopDetails?.minCoffeeQuantitySmall > 0 ?
                                                     selectedShopDetails.minCoffeeQuantitySmall / numberOfCoffees : 0;
                            
                            // Calculate percentage thresholds for small bags only
                            const smallBagsPercentage = perCoffeeMinSmall > 0 ? 
                                                       (item.smallBags / perCoffeeMinSmall) * 100 : 100;
                            
                            // Determine if small bags stock is low (below 75%) or critical (below 50%)
                            const isSmallBagsLow = perCoffeeMinSmall > 0 && smallBagsPercentage < 75 && smallBagsPercentage >= 50;
                            const isSmallBagsCritical = perCoffeeMinSmall > 0 && smallBagsPercentage < 50;
                            
                            // Determine row background color based only on small bags status
                            const isCritical = isSmallBagsCritical;
                            const isWarning = isSmallBagsLow && !isCritical;
                            const rowBgColor = isCritical 
                              ? '#fff8f8' // light red for critical
                              : isWarning 
                                ? '#fffaf0' // light orange/yellow for warning
                                : 'inherit'; // default for normal stock
                            
                            return (
                              <TableRow 
                                key={item.id} 
                                hover
                                sx={{ 
                                  backgroundColor: rowBgColor,
                                  '&:hover': {
                                    backgroundColor: isCritical 
                                      ? '#fff0f0' 
                                      : isWarning 
                                        ? '#fff5e6' 
                                        : undefined
                                  }
                                }}
                              >
                                {canUpdateInventory && (
                                  <TableCell align="center">
                                    <Tooltip title="Update Inventory">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleOpenInventoryDialog(item)}
                                        aria-label="update inventory"
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <strong>{item.coffee?.name || 'Unknown'}</strong>
                                </TableCell>
                                <TableCell>{item.coffee?.grade?.replace('_', ' ') || 'Unknown'}</TableCell>
                                <TableCell align="right">{item.smallBags ? item.smallBags.toFixed(2) : '0.00'}</TableCell>
                                <TableCell align="right">{item.largeBags ? item.largeBags.toFixed(2) : '0.00'}</TableCell>
                                <TableCell align="right">{item.totalQuantity ? item.totalQuantity.toFixed(2) : '0.00'} kg</TableCell>
                                <TableCell>
                                  {item.lastOrderDate
                                    ? format(new Date(item.lastOrderDate), 'MMM d, yyyy')
                                    : 'Never'}
                                </TableCell>
                                <TableCell>
                                  {(canUpdateInventory || isAdmin || isOwner) && selectedShopDetails && (
                                    <StockLevelAlert
                                      inventory={item}
                                      shopMinQuantities={selectedShopDetails}
                                      coffeeCount={availableCoffee.length || 1}
                                    />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Summary row with totals */}
                          {inventory.length > 0 && (
                            <TableRow sx={{ 
                              backgroundColor: '#f5f5f5', 
                              fontWeight: 'bold',
                              '& .MuiTableCell-root': { 
                                fontWeight: 'bold',
                                borderTop: '2px solid #e0e0e0' 
                              }
                            }}>
                              {canUpdateInventory && <TableCell />}
                              <TableCell colSpan={2}>
                                <Typography variant="subtitle2">TOTAL</Typography>
                              </TableCell>
                              <TableCell align="right">
                                {inventory.reduce((sum, item) => sum + (item.smallBags || 0), 0)}
                              </TableCell>
                              <TableCell align="right">
                                {inventory.reduce((sum, item) => sum + (item.largeBags || 0), 0)}
                              </TableCell>
                              <TableCell align="right">
                                {inventory.reduce((sum, item) => sum + (item.totalQuantity || 0), 0).toFixed(2)} kg
                              </TableCell>
                              <TableCell colSpan={2} />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Recent inventory alerts section for admin and owner - moved to bottom */}
                    {(isAdmin || isOwner) && (
                      <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">Recent Inventory Alerts</Typography>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleRunInventoryCheck}
                            disabled={checkingInventory}
                            startIcon={checkingInventory ? <CircularProgress size={20} /> : null}
                          >
                            Run Inventory Check
                          </Button>
                        </Box>
                        
                        {alertMessage && (
                          <IconlessAlert severity={alertMessage.type} sx={{ mb: 2 }}>
                            {alertMessage.text}
                          </IconlessAlert>
                        )}
                        
                        {recentAlertLogs.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Alert Type</TableCell>
                                  <TableCell>Small Bags</TableCell>
                                  <TableCell>Large Bags</TableCell>
                                  <TableCell>Emails Sent</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {recentAlertLogs.slice(0, 3).map((log) => (
                                  <TableRow key={log.id}>
                                    <TableCell>{format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
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
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            No recent alerts for this shop. Run a check to verify inventory levels.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
            
            {/* Inventory History Tab - Only visible for non-roaster users */}
            {!isRoaster && (
              <Box role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ py: 2 }}>
                {inventoryHistoryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography>Loading inventory history...</Typography>
                  </Box>
                ) : inventoryHistory.length === 0 ? (
                  <IconlessAlert severity="info">No inventory history available for this shop in the last 3 months</IconlessAlert>
                ) : (
                  <Paper elevation={1}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Coffee</TableCell>
                            <TableCell>Updated By</TableCell>
                            <TableCell align="right">Previous Qty</TableCell>
                            <TableCell align="right">New Qty</TableCell>
                            <TableCell align="right">Change</TableCell>
                            <TableCell>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inventoryHistory.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell>
                                {item.timestamp 
                                  ? format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')
                                  : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <strong>{item.coffee?.name || 'Unknown'}</strong>
                                {item.coffee?.grade && 
                                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                    {item.coffee.grade.replace('_', ' ')}
                                  </Typography>
                                }
                              </TableCell>
                              <TableCell>
                                {item.user?.name || 'Unknown'}
                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                  {item.user?.role || ''}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {item.changes?.previousValues?.totalQuantity?.toFixed(2) || '0.00'} kg
                              </TableCell>
                              <TableCell align="right">
                                {item.changes?.newValues?.totalQuantity?.toFixed(2) || '0.00'} kg
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  sx={{ 
                                    color: item.changes?.quantityChange > 0 
                                      ? 'success.main' 
                                      : item.changes?.quantityChange < 0 
                                        ? 'error.main' 
                                        : 'text.primary',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {item.changes?.quantityChange > 0 ? '+' : ''}
                                  {item.changes?.quantityChange?.toFixed(2) || '0.00'} kg
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  Small bags: {item.changes?.previousValues?.smallBags || 0} → {item.changes?.newValues?.smallBags || 0}
                                  <br />
                                  Large bags: {item.changes?.previousValues?.largeBags || 0} → {item.changes?.newValues?.largeBags || 0}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}
            
            {/* Orders Tab - Visible for all users */}
            <Box 
              role="tabpanel" 
              hidden={isRoaster ? tabIndex !== 0 : tabIndex !== 2} 
              id={isRoaster ? "tabpanel-0" : "tabpanel-2"} 
              aria-labelledby={isRoaster ? "tab-0" : "tab-2"} 
              sx={{ py: 2 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography>Loading orders...</Typography>
                </Box>
              ) : orders.length === 0 ? (
                <IconlessAlert severity="info">No orders available for this shop</IconlessAlert>
              ) : (
                <>
                  {/* Add the PendingOrdersSummary component for Owner, Retailer and Roaster users */}
                  {(isOwner || isRetailer || isRoaster) && (
                    <PendingOrdersSummary orders={orders} showShopInfo={true} />
                  )}
                  
                  <Paper elevation={1}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell align="right">Actions</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Ordered By</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>Total Quantity</TableCell>
                            <TableCell>Order ID</TableCell>
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
                                <TableCell>{order.id.substring(0, 8)}</TableCell>
                              </TableRow>
                              {expandedRows[order.id] && Array.isArray(order.items) && order.items.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={8} sx={{ py: 0 }}>
                                    <Box sx={{ margin: 1 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Order Details
                                      </Typography>
                                      
                                      {order.comment && (
                                        <Box 
                                          sx={{ 
                                            mb: 2, 
                                            p: 1.5, 
                                            bgcolor: '#f5f5f5', 
                                            borderRadius: 1,
                                            border: '1px solid #e0e0e0'
                                          }}
                                        >
                                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                                            Comment:
                                          </Typography>
                                          <Typography variant="body2">
                                            {order.comment}
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Coffee</TableCell>
                                            <TableCell>Grade</TableCell>
                                            <TableCell align="right">Small Bags (200g)</TableCell>
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
                                              <TableCell align="right">{item.smallBags ? item.smallBags.toFixed(2) : '0.00'}</TableCell>
                                              <TableCell align="right">{item.largeBags ? item.largeBags.toFixed(2) : '0.00'}</TableCell>
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
                </>
              )}
            </Box>
            
            {/* Pending Orders Summary Tab - New tab for all pending orders across shops */}
            <Box 
              role="tabpanel" 
              hidden={isRoaster ? tabIndex !== 1 : tabIndex !== 3} 
              id={isRoaster ? "tabpanel-1" : "tabpanel-3"} 
              aria-labelledby={isRoaster ? "tab-1" : "tab-3"} 
              sx={{ py: 2 }}
            >
              {allPendingOrdersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography>Loading pending orders summary...</Typography>
                </Box>
              ) : allPendingOrders.length === 0 ? (
                <IconlessAlert severity="info">No pending orders found across any shops</IconlessAlert>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Summary of All Pending Orders Across Shops
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This table summarizes all pending orders from all shops, grouped by coffee type.
                  </Typography>
                  <PendingOrdersSummary orders={allPendingOrders} showShopInfo={false} hideHeader={true} aggregateAcrossShops={true} />
                </>
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
          refreshData={fetchData}
        />
        
        {/* Inventory Update Dialog */}
        <InventoryUpdateDialog
          open={inventoryDialogOpen}
          onClose={handleCloseInventoryDialog}
          inventoryItem={selectedInventoryItem}
          refreshData={fetchData}
        />
      </Container>
    </>
  );
} 