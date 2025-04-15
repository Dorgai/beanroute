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
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

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

  // Fetch shops and available coffee on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shops
        const shopsRes = await fetch('/api/shops');
        const shopsData = await shopsRes.json();
        setShops(shopsData);

        // Fetch available coffee
        const coffeeRes = await fetch('/api/retail/available-coffee');
        const coffeeData = await coffeeRes.json();
        setAvailableCoffee(coffeeData);

        // Initialize order items
        const items = {};
        Object.values(coffeeData).flat().forEach(coffee => {
          items[coffee.id] = { smallBags: 0, largeBags: 0 };
        });
        setOrderItems(items);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            {grades.map((grade, index) => (
              <Tab key={grade} label={grade.replace('_', ' ')} id={`coffee-grade-tab-${index}`} />
            ))}
          </Tabs>
        </Box>

        {grades.map((grade, index) => (
          <TabPanel key={grade} value={currentTab} index={index}>
            {availableCoffee[grade].map((coffee) => (
              <Box key={coffee.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="h6">{coffee.name}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Available: {coffee.quantity} kg
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    label="Small Bags (250g)"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    value={orderItems[coffee.id]?.smallBags || 0}
                    onChange={(e) => handleQuantityChange(coffee.id, 'smallBags', e.target.value)}
                    size="small"
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
            ))}
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