import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Typography,
  FormHelperText,
  Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import IconlessAlert from '../ui/IconlessAlert';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coffee-grade-tabpanel-${index}`}
      aria-labelledby={`coffee-grade-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RetailOrderDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [availableCoffee, setAvailableCoffee] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [orderItems, setOrderItems] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [comment, setComment] = useState('');
  const [commentCharCount, setCommentCharCount] = useState(0);
  const [pendingOrdersData, setPendingOrdersData] = useState({});

  // Fetch shops and available coffee on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shops
        const shopsRes = await fetch('/api/shops');
        const shopsData = await shopsRes.json();
        setShops(shopsData);

        // Fetch available coffee (only if a shop is selected)
        if (selectedShop) {
          const coffeeRes = await fetch(`/api/retail/available-coffee?shopId=${selectedShop}`);
          const coffeeData = await coffeeRes.json();
          
          // Group coffees by grade
          const groupedCoffee = {};
          if (Array.isArray(coffeeData)) {
            coffeeData.forEach(coffee => {
              const grade = coffee.grade || 'OTHER';
              if (!groupedCoffee[grade]) {
                groupedCoffee[grade] = [];
              }
              groupedCoffee[grade].push(coffee);
            });
          }
          setAvailableCoffee(groupedCoffee);

          // Initialize order items
          const items = {};
          if (Array.isArray(coffeeData)) {
            coffeeData.forEach(coffee => {
              items[coffee.id] = { smallBags: 0, largeBags: 0 };
            });
          }
          setOrderItems(items);
        }

        // Fetch pending orders data
        const pendingRes = await fetch('/api/retail/pending-orders-by-coffee');
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          const pendingMap = {};
          pendingData.forEach(item => {
            pendingMap[item.coffeeId] = item;
          });
          setPendingOrdersData(pendingMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, selectedShop]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleQuantityChange = (coffeeId, field, value) => {
    setOrderItems(prev => ({
      ...prev,
      [coffeeId]: {
        ...prev[coffeeId],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    setCommentCharCount(value.length);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate shop selection
      if (!selectedShop) {
        setError('Please select a shop');
        return;
      }

      // Filter out items with no quantity
      const items = Object.entries(orderItems)
        .filter(([_, item]) => item.smallBags > 0 || item.largeBags > 0)
        .map(([coffeeId, item]) => ({
          coffeeId,
          ...item
        }));

      if (items.length === 0) {
        setError('Please add at least one item to the order');
        return;
      }

      // Validate comment length
      if (comment && comment.length > 200) {
        setError('Comment must be 200 characters or less');
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
          comment: comment.trim() || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const grades = Object.keys(availableCoffee);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Retail Order</DialogTitle>
      <DialogContent>
        {error && (
          <IconlessAlert severity="error" sx={{ mb: 2 }}>
            {error}
          </IconlessAlert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Shop</InputLabel>
          <Select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            label="Shop"
          >
            {shops.map((shop) => (
              <MenuItem key={shop.id} value={shop.id}>
                {shop.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Order Comment (Optional)"
          placeholder="Enter any notes or special instructions for this order"
          multiline
          rows={2}
          fullWidth
          value={comment}
          onChange={handleCommentChange}
          sx={{ mb: 3 }}
          inputProps={{ maxLength: 200 }}
          helperText={`${commentCharCount}/200 characters`}
          FormHelperTextProps={{
            sx: { 
              textAlign: 'right',
              color: commentCharCount > 180 ? 'warning.main' : 'text.secondary'
            }
          }}
        />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            {grades.map((grade, index) => (
              <Tab key={grade} label={grade.replace('_', ' ')} id={`coffee-grade-tab-${index}`} />
            ))}
          </Tabs>
        </Box>

        <IconlessAlert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Available Quantities</Typography>
          <Typography variant="body2">
            Available quantities shown are after applying a 15% haircut for processing losses. 
            The actual green stock is higher than what's available for ordering.
          </Typography>
        </IconlessAlert>

        {grades.map((grade, index) => (
          <TabPanel key={grade} value={currentTab} index={index}>
            {availableCoffee[grade].map((coffee) => {
              const pendingData = pendingOrdersData[coffee.id];
              const pendingSmallBags = pendingData ? pendingData.totalSmallBags : 0;
              
              return (
                <Box key={coffee.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="h6">{coffee.name}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Available: {coffee.quantity} kg
                    {coffee.originalQuantity && (
                      <span style={{ marginLeft: '8px', color: '#666' }}>
                        (Green stock: {coffee.originalQuantity.toFixed(2)} kg)
                      </span>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    {coffee.isEspresso && (
                      <Chip 
                        label="E" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#fff3e0', 
                          color: '#e65100',
                          fontSize: '0.7rem',
                          height: '20px'
                        }} 
                      />
                    )}
                    {coffee.isFilter && (
                      <Chip 
                        label="F" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#e3f2fd', 
                          color: '#1565c0',
                          fontSize: '0.7rem',
                          height: '20px'
                        }} 
                      />
                    )}
                    {coffee.isSignature && (
                      <Chip 
                        label="S" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#f3e5f5', 
                          color: '#7b1fa2',
                          fontSize: '0.7rem',
                          height: '20px'
                        }} 
                      />
                    )}
                  </Box>
                  {coffee.haircutAmount && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Haircut applied: -{coffee.haircutAmount.toFixed(2)} kg (15%)
                    </Typography>
                  )}
                  {pendingSmallBags > 0 && (
                    <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                      ⚠️ {pendingSmallBags} small bags in {pendingData.orderCount} pending order{pendingData.orderCount !== 1 ? 's' : ''} (all shops)
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                      label="Small Bags (200g)"
                      type="number"
                      value={orderItems[coffee.id]?.smallBags || 0}
                      onChange={(e) => handleQuantityChange(coffee.id, 'smallBags', e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                      fullWidth
                      error={Boolean(validationErrors[coffee.id])}
                      helperText={validationErrors[coffee.id] || ''}
                    />
                    <TextField
                      label="Large Bags (1kg)"
                      type="number"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={orderItems[coffee.id]?.largeBags || 0}
                      onChange={(e) => handleQuantityChange(coffee.id, 'largeBags', e.target.value)}
                      size="small"
                    />
                  </Box>
                </Box>
              );
            })}
          </TabPanel>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton onClick={handleSubmit} loading={loading} variant="contained">
          Create Order
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
} 