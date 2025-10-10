// Cache bust: table background fix v3 - force complete rebuild
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/session';
import { useTheme } from '../contexts/ThemeContext';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';
import InventoryUpdateDialog from '@/components/retail/InventoryUpdateDialog';
import IconlessAlert from '../components/ui/IconlessAlert';
import CollapsibleAlert from '../components/ui/CollapsibleAlert';
import ShopStockSummary from '../components/retail/ShopStockSummary';
import PendingOrdersSummary from '../components/retail/PendingOrdersSummary';

// Simple Order Dialog Component
function OrderDialog({ open, onClose, coffeeItems, selectedShop, haircutPercentage }) {
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [comment, setComment] = useState('');
  const [pendingOrdersData, setPendingOrdersData] = useState({});
  
  // Template functionality
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    // Reset order items when dialog opens with defensive checks
    if (open && Array.isArray(coffeeItems) && coffeeItems.length > 0) {
      const initialItems = {};
      coffeeItems.forEach(coffee => {
        if (coffee && coffee.id) {
          initialItems[coffee.id] = { 
            smallBagsEspresso: '', 
            smallBagsFilter: '', 
            largeBags: '' 
          };
        }
      });
      setOrderItems(initialItems);
      setValidationErrors({});
      setComment('');
      setError(null); // Clear any previous errors when dialog opens
      setSelectedTemplate(''); // Reset template selection
      
      // Fetch available templates
      fetchAvailableTemplates();
    } else if (open) {
      // If coffeeItems is not a valid array or is empty
      console.warn('No valid coffee items available for ordering');
      setError(null); // Clear any previous errors when dialog opens
    }
  }, [open, coffeeItems]);

  // Fetch pending orders data when dialog opens
  useEffect(() => {
    const fetchPendingOrdersData = async () => {
      if (!open) return;
      
      try {
        const response = await fetch('/api/retail/pending-orders-by-coffee');
        if (!response.ok) {
          console.error('Failed to fetch pending orders data');
          return;
        }
        
        const data = await response.json();
        
        // Convert to a map for easy lookup
        const pendingMap = {};
        data.forEach(item => {
          pendingMap[item.coffeeId] = item;
        });
        
        setPendingOrdersData(pendingMap);
      } catch (error) {
        console.error('Error fetching pending orders data:', error);
      }
    };

    fetchPendingOrdersData();
  }, [open]);
  
  // Calculate total quantity for a coffee item in kg
  const calculateTotalQuantity = (smallBagsEspresso, smallBagsFilter, largeBags) => {
    return ((smallBagsEspresso + smallBagsFilter) * 0.2) + (largeBags * 1.0);
  };
  
  // Validate if the requested quantity is within available limits
  const validateQuantity = (coffeeId, smallBagsEspresso, smallBagsFilter, largeBags) => {
    const coffee = coffeeItems.find(c => c.id === coffeeId);
    if (!coffee) return true; // Can't validate if coffee not found
    
    const requestedQuantity = calculateTotalQuantity(smallBagsEspresso, smallBagsFilter, largeBags);
    const realTimeAvailable = calculateRealTimeAvailableQuantity(coffee);
    const isValid = realTimeAvailable >= requestedQuantity;
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [coffeeId]: isValid ? null : `Exceeds available quantity (${realTimeAvailable.toFixed(2)}kg)`
    }));
    
    return isValid;
  };

  // Calculate real-time available quantity for a coffee considering current order inputs
  const calculateRealTimeAvailableQuantity = (coffee) => {
    if (!coffee || typeof coffee.quantity !== 'number') return 0;
    
    // Start with the original available quantity (after haircut)
    let availableQuantity = coffee.quantity;
    
    // Subtract current order inputs from this dialog
    const currentOrder = orderItems[coffee.id];
    if (currentOrder) {
      const espressoInput = parseInt(currentOrder.smallBagsEspresso) || 0;
      const filterInput = parseInt(currentOrder.smallBagsFilter) || 0;
      const largeBagsInput = parseInt(currentOrder.largeBags) || 0;
      
      const currentOrderQuantity = ((espressoInput + filterInput) * 0.2) + (largeBagsInput * 1.0);
      availableQuantity -= currentOrderQuantity;
    }
    
    return Math.max(0, availableQuantity); // Never go below 0
  };

  const handleQuantityChange = (coffeeId, field, value) => {
    if (!coffeeId) {
      console.warn('Invalid coffeeId in handleQuantityChange');
      return;
    }
    
    // Allow empty string or valid numbers
    const updatedValues = {
      ...orderItems[coffeeId],
      [field]: value
    };
    
    setOrderItems(prev => ({
      ...prev,
      [coffeeId]: updatedValues
    }));
    
    // Only validate if we have actual numeric values
    const espressoValue = parseInt(updatedValues.smallBagsEspresso) || 0;
    const filterValue = parseInt(updatedValues.smallBagsFilter) || 0;
    const largeBagsValue = parseInt(updatedValues.largeBags) || 0;
    
    // Validate after updating
    validateQuantity(coffeeId, espressoValue, filterValue, largeBagsValue);
  };

  const handleSubmit = async () => {
    try {
      console.log('[OrderDialog] Starting order submission...');
      setLoading(true);
      setError(null);

      // Validate shop selection
      if (!selectedShop) {
        console.log('[OrderDialog] No shop selected');
        setError('Please select a shop');
        setLoading(false);
        return;
      }

      // Defensive check for orderItems
      if (!orderItems || typeof orderItems !== 'object') {
        console.log('[OrderDialog] Invalid order items:', orderItems);
        setError('Invalid order data');
        setLoading(false);
        return;
      }

      // Filter out items with no quantity
      const items = Object.entries(orderItems)
        .filter(([coffeeId, item]) => {
          // Validate that coffeeId exists and item is valid
          if (!coffeeId || !item) return false;
          const espressoValue = parseInt(item.smallBagsEspresso) || 0;
          const filterValue = parseInt(item.smallBagsFilter) || 0;
          const largeBagsValue = parseInt(item.largeBags) || 0;
          return (espressoValue > 0 || filterValue > 0 || largeBagsValue > 0);
        })
        .map(([coffeeId, item]) => ({
          coffeeId,
          smallBagsEspresso: parseInt(item.smallBagsEspresso) || 0,
          smallBagsFilter: parseInt(item.smallBagsFilter) || 0,
          largeBags: parseInt(item.largeBags) || 0
        }));

      console.log('[OrderDialog] Filtered items for order:', items);

      if (items.length === 0) {
        console.log('[OrderDialog] No items with quantities found');
        setError('Please add at least one item to the order');
        setLoading(false);
        return;
      }
      
      // Check for any validation errors before submitting
      const hasValidationErrors = Object.values(validationErrors).some(error => error !== null);
      if (hasValidationErrors) {
        console.log('[OrderDialog] Validation errors found:', validationErrors);
        setError('Please correct the quantity errors before submitting');
        setLoading(false);
        return;
      }

      // Create the order with fast timeout and optimistic handling
      console.log('[OrderDialog] Sending order request to API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
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
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));
      
      console.log('Order creation API response:', { status: response.status, ok: response.ok, data: responseData });
      
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

      console.log('[OrderDialog] Order created successfully, calling onClose(true)');
      
      // Clear form data
      setOrderItems({});
      setComment('');
      setValidationErrors({});
      setError(null); // Clear any previous errors
      
      console.log('[OrderDialog] About to call onClose(true), onClose function:', typeof onClose);
      if (typeof onClose === 'function') {
        // Close immediately after successful API response
        onClose(true); // Pass true to indicate successful order
        console.log('[OrderDialog] onClose(true) called successfully');
      } else {
        console.error('[OrderDialog] onClose is not a function:', onClose);
      }
    } catch (error) {
      console.error('[OrderDialog] Error creating order:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      console.log('[OrderDialog] Loading state reset to false');
    }
  };

  // Save template function
  // Fetch available templates
  const fetchAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/retail/order-templates');
      if (response.ok) {
        const templates = await response.json();
        setAvailableTemplates(templates);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Load selected template
  const handleLoadTemplate = async (templateId) => {
    if (!templateId) return;

    try {
      const template = availableTemplates.find(t => t.id === templateId);
      if (!template) return;

      // Create new order items based on template
      const newOrderItems = {};
      
      // Initialize all coffee items to empty
      if (Array.isArray(coffeeItems)) {
        coffeeItems.forEach(coffee => {
          if (coffee && coffee.id) {
            newOrderItems[coffee.id] = { 
              smallBagsEspresso: '', 
              smallBagsFilter: '', 
              largeBags: '' 
            };
          }
        });
      }

      // Fill in quantities from template for available coffees
      template.items.forEach(templateItem => {
        if (newOrderItems[templateItem.coffeeId]) {
          newOrderItems[templateItem.coffeeId] = {
            smallBagsEspresso: templateItem.smallBagsEspresso.toString(),
            smallBagsFilter: templateItem.smallBagsFilter.toString(),
            largeBags: templateItem.largeBags.toString()
          };
        }
      });

      setOrderItems(newOrderItems);
      setError(null);
      
      // Show info about loaded template
      const loadedItems = template.items.filter(item => 
        coffeeItems.some(coffee => coffee.id === item.coffeeId)
      );
      const unavailableItems = template.items.filter(item => 
        !coffeeItems.some(coffee => coffee.id === item.coffeeId)
      );
      
      let message = `Template "${template.name}" loaded with ${loadedItems.length} items.`;
      if (unavailableItems.length > 0) {
        message += ` ${unavailableItems.length} items were skipped (coffee not available).`;
      }
      
      // Use a temporary success message instead of alert
      setError(`✅ ${message}`);
      setTimeout(() => setError(null), 5000);
      
    } catch (error) {
      setError('Error loading template: ' + error.message);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }

    try {
      const templateItems = Object.entries(orderItems)
        .filter(([coffeeId, quantities]) => {
          const total = (parseInt(quantities.smallBagsEspresso) || 0) +
                        (parseInt(quantities.smallBagsFilter) || 0) +
                        (parseInt(quantities.largeBags) || 0);
          return total > 0;
        })
        .map(([coffeeId, quantities]) => ({
          coffeeId,
          smallBagsEspresso: parseInt(quantities.smallBagsEspresso) || 0,
          smallBagsFilter: parseInt(quantities.smallBagsFilter) || 0,
          largeBags: parseInt(quantities.largeBags) || 0,
          totalQuantity: ((parseInt(quantities.smallBagsEspresso) || 0) +
                          (parseInt(quantities.smallBagsFilter) || 0)) * 0.2 +
                          (parseInt(quantities.largeBags) || 0) * 1.0
        }));

      if (templateItems.length === 0) {
        setError('Please add some quantities before saving as template');
        return;
      }

      const response = await fetch('/api/retail/order-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: `Template created from order with ${templateItems.length} items`,
          shopId: selectedShop,
          items: templateItems
        })
      });

      if (response.ok) {
        setShowSaveTemplate(false);
        setTemplateName('');
        setError(null);
        // Refresh templates list
        fetchAvailableTemplates();
        alert('Template saved successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save template');
      }
    } catch (error) {
      setError('Error saving template: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={(event, reason) => {
      // Only close if user clicks outside or presses escape
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        onClose(false);
      }
    }} maxWidth="md">
      <DialogTitle sx={{ 
        borderBottom: '1px solid #eee', 
        pb: 2,
        bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
        color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
      }}>
        Create Order
      </DialogTitle>
      <DialogContent sx={{ 
        pt: 3,
        bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white'
      }}>
        
        {/* Template Selection Section */}
        {availableTemplates.length > 0 && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5', 
            borderRadius: 1,
            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
          }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1, 
              fontWeight: 600,
              color: theme => theme.palette.mode === 'dark' ? '#f3f4f6' : 'inherit'
            }}>
              📋 Load from Template
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    handleLoadTemplate(e.target.value);
                  }}
                  displayEmpty
                  sx={{ 
                    bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.mode === 'dark' ? '#0066ff' : 'rgba(0, 0, 0, 0.87)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.primary.main
                    },
                    '& .MuiSelect-icon': {
                      color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                        '& .MuiMenuItem-root': {
                          color: theme => theme.palette.mode === 'dark' ? 'white' : 'black',
                          '&:hover': {
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                          },
                          '&.Mui-selected': {
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.12)',
                            '&:hover': {
                              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.3)' : 'rgba(25, 118, 210, 0.2)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a template...</em>
                  </MenuItem>
                  {availableTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.items?.length || 0} items)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                Templates will populate quantities for available coffees
              </Typography>
            </Box>
          </Box>
        )}
        <CollapsibleAlert title="Order Information" sx={{ mb: 3 }}>
          <ul style={{ paddingLeft: '20px', margin: '0', fontSize: '0.875rem' }}>
            <li>Espresso bags = 200g each (0.2kg)</li>
            <li>Filter bags = 200g each (0.2kg)</li>
            <li>Large bags = 1kg each</li>
            <li>Orders cannot exceed available coffee quantity</li>
            <li>Enter the number of bags you want to order</li>
          </ul>
        </CollapsibleAlert>
        
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
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'rgba(0, 0, 0, 0.23)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.mode === 'dark' ? '#0066ff' : 'rgba(0, 0, 0, 0.87)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.primary.main
                }
              },
              '& .MuiInputLabel-root': {
                color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)'
              },
              '& .MuiInputBase-input': {
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
              }
            }}
          />
        </Box>
        
        {!Array.isArray(coffeeItems) || coffeeItems.length === 0 ? (
          <IconlessAlert severity="info">No coffee available for ordering</IconlessAlert>
        ) : (
          <>
            <CollapsibleAlert title="Available Quantities" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Available quantities shown are after applying a {haircutPercentage}% haircut for processing losses. 
                The actual green stock is higher than what's available for ordering.
              </Typography>
            </CollapsibleAlert>
            
            <TableContainer component={Paper} sx={{ 
              mt: 2,
              bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
              border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
            }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Coffee</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Available (After {haircutPercentage}% Haircut)</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Pending Espresso Bags (All Shops)</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Pending Filter Bags (All Shops)</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Espresso Bags (200g)</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Filter Bags (200g)</TableCell>
                    <TableCell sx={{ 
                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600
                    }}>Large Bags (1kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
                  {(() => {
                    // Group coffees by grade
                    const filteredCoffees = coffeeItems.filter(coffee => {
                      return coffee && coffee.quantity > 0;
                    });
                    
                    const groupedCoffees = {
                      premium: [],
                      specialty: [],
                      rarity: [],
                      decaf: [],
                      other: []
                    };
                    
                    filteredCoffees.forEach(coffee => {
                      const grade = coffee.grade?.toLowerCase() || '';
                      if (grade.includes('decaf')) {
                        groupedCoffees.decaf.push(coffee);
                      } else if (grade.includes('rarity')) {
                        groupedCoffees.rarity.push(coffee);
                      } else if (grade.includes('specialty')) {
                        groupedCoffees.specialty.push(coffee);
                      } else if (grade.includes('premium')) {
                        groupedCoffees.premium.push(coffee);
                      } else {
                        groupedCoffees.other.push(coffee);
                      }
                    });
                    
                    // Render sections
                    const sections = [
                      { key: 'premium', title: 'Premium Grade', coffees: groupedCoffees.premium },
                      { key: 'specialty', title: 'Specialty Grade', coffees: groupedCoffees.specialty },
                      { key: 'rarity', title: 'Rarity Grade', coffees: groupedCoffees.rarity },
                      { key: 'decaf', title: 'Decaf', coffees: groupedCoffees.decaf },
                      { key: 'other', title: 'Other', coffees: groupedCoffees.other }
                    ];
                    
                    return sections.map(section => {
                      if (section.coffees.length === 0) return null;
                      
                      return (
                        <React.Fragment key={section.key}>
                          {/* Section Header */}
                          <TableRow sx={{ 
                            bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5',
                            borderBottom: theme => theme.palette.mode === 'dark' ? '2px solid #6b7280' : '2px solid #e0e0e0'
                          }}>
                            <TableCell colSpan={7} sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.9rem',
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'primary.main',
                              py: 1
                            }}>
                              {section.title} ({section.coffees.length} coffee{section.coffees.length !== 1 ? 's' : ''})
                            </TableCell>
                          </TableRow>
                          
                          {/* Section Coffees */}
                          {section.coffees.map((coffee) => {
                    if (!coffee || !coffee.id) return null;
                    
                    const pendingData = pendingOrdersData[coffee.id];
                    const pendingEspressoBags = pendingData ? pendingData.smallBagsEspresso : 0;
                    const pendingFilterBags = pendingData ? pendingData.smallBagsFilter : 0;
                    
                    // Calculate real-time available quantity
                    const realTimeAvailable = calculateRealTimeAvailableQuantity(coffee);
                    
                    return (
                      <TableRow key={coffee.id} hover sx={{
                        bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}>
                        <TableCell>
                          <strong>{coffee.name || 'Unknown'}</strong> 
                          <Typography variant="caption" color="text.secondary" display="block">
                            {coffee.grade ? coffee.grade.replace('_', ' ') : 'Unknown grade'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
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
                          {coffee.originalQuantity && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Green stock: {coffee.originalQuantity.toFixed(2)} kg
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            sx={{ 
                              fontWeight: 'bold',
                              color: realTimeAvailable <= 0 ? 'error.main' : 'text.primary'
                            }}
                          >
                            {realTimeAvailable.toFixed(2)} kg
                          </Typography>
                          {coffee.haircutAmount && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              (-{coffee.haircutAmount.toFixed(2)} kg haircut)
                            </Typography>
                          )}
                          {realTimeAvailable !== coffee.quantity && (
                            <Typography variant="caption" color="warning.main" display="block">
                              ({(coffee.quantity - realTimeAvailable).toFixed(2)} kg in current order)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {pendingEspressoBags > 0 ? (
                            <Box>
                              <Typography variant="body2" color="warning.main" fontWeight="bold">
                                {pendingEspressoBags} bags ({(pendingEspressoBags * 0.2).toFixed(1)}kg)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                in {pendingData.orderCount} pending order{pendingData.orderCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No pending orders
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {pendingFilterBags > 0 ? (
                            <Box>
                              <Typography variant="body2" color="warning.main" fontWeight="bold">
                                {pendingFilterBags} bags ({(pendingFilterBags * 0.2).toFixed(1)}kg)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                in {pendingData.orderCount} pending order{pendingData.orderCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No pending orders
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={orderItems[coffee.id]?.smallBagsEspresso || ''}
                            placeholder="0"
                            onChange={(e) => handleQuantityChange(coffee.id, 'smallBagsEspresso', e.target.value)}
                            size="small"
                            fullWidth
                            error={Boolean(validationErrors[coffee.id])}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#0066ff' : 'rgba(0, 0, 0, 0.87)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.primary.main
                                }
                              },
                              '& .MuiInputBase-input': {
                                color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: theme => theme.palette.mode === 'dark' ? '#9ca3af' : '#bbb',
                                opacity: 1
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={orderItems[coffee.id]?.smallBagsFilter || ''}
                            placeholder="0"
                            onChange={(e) => handleQuantityChange(coffee.id, 'smallBagsFilter', e.target.value)}
                            size="small"
                            fullWidth
                            error={Boolean(validationErrors[coffee.id])}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#0066ff' : 'rgba(0, 0, 0, 0.87)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.primary.main
                                }
                              },
                              '& .MuiInputBase-input': {
                                color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: theme => theme.palette.mode === 'dark' ? '#9ca3af' : '#bbb',
                                opacity: 1
                              }
                            }}
                          />
                          {validationErrors[coffee.id] && (
                            <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                              {validationErrors[coffee.id]}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={orderItems[coffee.id]?.largeBags || ''}
                            placeholder="0"
                            onChange={(e) => handleQuantityChange(coffee.id, 'largeBags', e.target.value)}
                            size="small"
                            fullWidth
                            error={Boolean(validationErrors[coffee.id])}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.mode === 'dark' ? '#0066ff' : 'rgba(0, 0, 0, 0.87)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme => theme.palette.primary.main
                                }
                              },
                              '& .MuiInputBase-input': {
                                color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: theme => theme.palette.mode === 'dark' ? '#9ca3af' : '#bbb',
                                opacity: 1
                              }
                            }}
                          />
                          {validationErrors[coffee.id] && (
                            <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                              {validationErrors[coffee.id]}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #eee', 
        pt: 2, 
        pb: 2,
        bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white'
      }}>
        <Button 
          onClick={() => onClose(false)}
          sx={{
            color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit',
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        
          {/* Debug info */}
        
        {showSaveTemplate ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              sx={{ minWidth: 150 }}
            />
            <Button onClick={handleSaveTemplate} variant="outlined" size="small">
              Save
            </Button>
            <Button onClick={() => setShowSaveTemplate(false)} size="small">
              Cancel
            </Button>
          </Box>
        ) : (
          <Button 
            onClick={() => {
              console.log('Save as Template clicked - selectedShop:', selectedShop, 'coffeeItems:', coffeeItems);
              setShowSaveTemplate(true);
            }}
            startIcon={<SaveIcon />}
            disabled={
              !selectedShop || 
              !Array.isArray(coffeeItems) || 
              coffeeItems.length === 0
            }
          >
            Save as Template
          </Button>
        )}
        
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
          sx={{
            bgcolor: '#6b7280',
            '&:hover': {
              bgcolor: '#4b5563'
            },
            '&:disabled': {
              bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#e5e7eb',
              color: theme => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280'
            }
          }}
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
  const themeContext = useTheme();
  const isDark = themeContext?.isDark ?? false;
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
  console.log('StatusUpdateDialog - Order received:', order);
  console.log('StatusUpdateDialog - Dialog open:', open);

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

  const handleSubmit = async (retryCount = 0) => {
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
      console.log(`[StatusUpdateDialog] Submitting status update: Order ID ${order.id}, Status ${status} (attempt ${retryCount + 1})`);

      // Close dialog immediately for better UX (optimistic UI)
      console.log('[StatusUpdateDialog] Closing dialog immediately for better UX');
      onClose(true, status);
      
      // Continue with API call in background
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('/api/retail/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const responseData = await response.json();
      console.log('[StatusUpdateDialog] Status update response:', responseData);
      
      if (!response.ok) {
        console.error('[StatusUpdateDialog] Status update failed:', responseData);
        // Note: Dialog is already closed, so we can't show error in dialog
        // Could implement toast notifications here if needed
        throw new Error(responseData.error || 'Failed to update order status');
      }

      console.log('[StatusUpdateDialog] Order status updated successfully in background');
      
      // Force a refresh of the data after successful update
      if (typeof refreshData === 'function') {
        setTimeout(() => {
          console.log('[StatusUpdateDialog] Refreshing data after successful status update');
          refreshData();
        }, 500);
      } else {
        console.warn('[StatusUpdateDialog] refreshData is not a function, skipping refresh');
      }
    } catch (error) {
      console.error('[StatusUpdateDialog] Error updating order status:', error);
      
      if (error.name === 'AbortError') {
        // On timeout, assume success since database usually updates even when response is lost
        console.log('[StatusUpdateDialog] Request timed out, but assuming success due to Railway infrastructure issues');
        
        // Refresh data to get latest status (dialog is already closed)
        if (typeof refreshData === 'function') {
          setTimeout(() => {
            console.log('[StatusUpdateDialog] Refreshing data after timeout (assuming success)');
            refreshData();
          }, 500);
        }
      } else {
        // For other errors, we could implement toast notifications since dialog is closed
        console.error('[StatusUpdateDialog] Status update failed with error:', error.message);
        // Note: Dialog is already closed, so we can't show error in dialog UI
        // Future: Could implement toast notifications or global error handling here
      }
    } finally {
      setLoading(false);
    }
  };

  // Get valid next statuses
  const validNextStatuses = getValidNextStatuses();

  // Safety check - don't render if no order
  if (!order) {
    console.warn('StatusUpdateDialog: No order provided, not rendering');
    return null;
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
        Update Order Status
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <IconlessAlert severity="error" sx={{ 
            mb: 2,
            borderRadius: 1,
            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
          }}>
            {error}
            {apiResponse && process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                API Response: {JSON.stringify(apiResponse, null, 2)}
              </Typography>
            )}
          </IconlessAlert>
        )}
        
        {!order && (
          <IconlessAlert severity="warning" sx={{ 
            mb: 2,
            borderRadius: 1,
            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
          }}>
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
              <Box sx={{ 
                mt: 1, 
                mb: 2, 
                p: 1.5, 
                bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5', 
                borderRadius: 1, 
                border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0' 
              }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom sx={{ color: theme => theme.palette.mode === 'dark' ? '#f3f4f6' : 'inherit' }}>
                  Comment:
                </Typography>
                <Typography variant="body2" sx={{ color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit' }}>
                  {order.comment}
                </Typography>
              </Box>
            )}
            
            {validNextStatuses.length === 0 && (isRoaster || isRetailer || isBarista) && (
              <IconlessAlert severity="info" sx={{ 
                mt: 2, 
                mb: 1,
                borderRadius: 1,
                border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
              }}>
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
          onClick={() => {
            console.log('Submit button clicked - checking conditions:', {
              loading,
              hasOrder: !!order,
              hasOrderId: !!(order && order.id),
              hasStatus: !!status,
              isRoaster,
              isRetailer, 
              isBarista,
              validNextStatusesLength: validNextStatuses.length,
              isDisabled: loading || !order || !order.id || !status || ((isRoaster || isRetailer || isBarista) && validNextStatuses.length === 0)
            });
            handleSubmit();
          }} 
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
                             (inventory.smallBagsEspresso / perCoffeeMinSmall) * 100 : 100;
  
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
  const themeContext = useTheme();
  const isDark = themeContext?.isDark ?? false;
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
  const [pendingOrdersViewMode, setPendingOrdersViewMode] = useState('aggregated'); // 'shop' or 'aggregated'
  const [haircutPercentage, setHaircutPercentage] = useState(15); // Default to 15%
  
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
    console.log('Checking stored shop preference:', storedShopId);
    if (storedShopId) {
      console.log('Setting selectedShop from localStorage:', storedShopId);
      setSelectedShop(storedShopId);
    }
  }, []);

  // Fetch haircut percentage
  const fetchHaircutPercentage = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/haircut-settings');
      if (response.ok) {
        const data = await response.json();
        setHaircutPercentage(data.percentage);
      }
    } catch (error) {
      console.error('Failed to fetch haircut percentage:', error);
      // Keep default value of 15%
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
          console.log('Auto-selecting first shop:', shopId, shopArray[0].name);
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
  }, []); // Remove selectedShop dependency to prevent circular updates

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

  // Fetch data function - moved to component level for accessibility
  const fetchData = useCallback(async (useDirectMode = false, retryCount = 0) => {
    if (!selectedShop) return;
    
    // Prevent infinite recursion
    if (retryCount > 3) {
      console.error('Maximum retry attempts reached for fetchData');
      setError('Failed to load data after multiple attempts. Please refresh the page.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch haircut percentage
      await fetchHaircutPercentage();
      
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
            // Retry with direct mode and increment retry count
            return fetchData(true, retryCount + 1);
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
        
        if (!inventoryData || !inventoryData.inventory || !Array.isArray(inventoryData.inventory)) {
          console.error('Invalid inventory data format:', inventoryData);
          setInventory([]);
        } else {
          // The new API returns an object with summary and inventory
          const inventoryArray = inventoryData.inventory;
          console.log('Processed inventory:', inventoryArray);
          console.log('Inventory summary:', inventoryData.summary);
          setInventory(inventoryArray.filter(Boolean)); // Filter out null/undefined items
          
          // Cache inventory data for emergency fallback
          try {
            localStorage.setItem('cachedInventory', JSON.stringify(inventoryArray));
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
  }, [selectedShop, fetchHaircutPercentage]);

  // Fetch inventory and available coffee when shop changes
  useEffect(() => {
    if (!selectedShop) return;
    
    // Store selected shop in localStorage for persistence
    localStorage.setItem('selectedShopId', selectedShop);
    
    fetchData();
  }, [selectedShop, fetchData]);
  
  // Fetch available coffee separately
  useEffect(() => {
    const fetchAvailableCoffee = async () => {
        console.log('🔥 FRESH CODE 2025-09-30 fetchAvailableCoffee called with selectedShop:', selectedShop, typeof selectedShop);
      if (!selectedShop || selectedShop === '' || selectedShop === null || selectedShop === undefined) {
        console.log('No selectedShop (empty/null/undefined), skipping coffee fetch');
        setAvailableCoffee([]);
        return;
      }
      
      try {
        console.log('Fetching available coffee for shop:', selectedShop);
        const coffeeResponse = await fetch(`/api/retail/available-coffee?shopId=${selectedShop}`);
        if (!coffeeResponse.ok) {
          throw new Error(`Failed to fetch available coffee (${coffeeResponse.status})`);
        }
        
        try {
          const coffeeData = await coffeeResponse.json();
          console.log('Available coffee API response:', coffeeData);
          
          if (!coffeeData || !Array.isArray(coffeeData)) {
            console.error('Invalid coffee data format:', coffeeData);
            setAvailableCoffee([]);
          } else {
            console.log('Processed coffee:', coffeeData);
            setAvailableCoffee(coffeeData);
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
    
    console.log('🔥 FRESH CODE 2025-09-30 useEffect for fetchAvailableCoffee triggered, selectedShop:', selectedShop);
    fetchAvailableCoffee();
  }, [selectedShop]);

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
    console.log('[handleCloseOrderDialog] Called with success:', success);
    console.log('[handleCloseOrderDialog] Current orderDialogOpen state:', orderDialogOpen);
    setOrderDialogOpen(false);
    console.log('[handleCloseOrderDialog] Set orderDialogOpen to false');
    if (success) {
      console.log('[handleCloseOrderDialog] Success=true, refreshing data...');
      // Refresh data after successful order
      fetchData();
    }
    // Clear any error state when dialog is closed
    setError(null);
    console.log('[handleCloseOrderDialog] Completed');
  };
  
  const handleOpenStatusDialog = (order) => {
    try {
      console.log('Opening status dialog for order:', order?.id);
      console.log('Order object:', order);
      console.log('Current theme context:', themeContext);
      console.log('isDark value:', isDark);
      if (!order) {
        console.error('No order provided to handleOpenStatusDialog');
        return;
      }
      if (!order.id) {
        console.error('Order missing ID:', order);
        return;
      }
      setSelectedOrder(order);
      setStatusDialogOpen(true);
      console.log('Status dialog should now be open');
    } catch (error) {
      console.error('Error in handleOpenStatusDialog:', error);
    }
  };
  
  const handleCloseStatusDialog = (success, newStatus) => {
    console.log('handleCloseStatusDialog called with success:', success, 'newStatus:', newStatus);
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
  


  // Fetch all pending orders across all shops
  useEffect(() => {
    const fetchAllPendingOrders = async () => {
      // Check if we're on the Pending Orders Summary tab
      const isPendingOrdersTab = isRoaster ? tabIndex === 1 : tabIndex === 3;
      if (!isPendingOrdersTab) return;
      
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
  }, [tabIndex, isRoaster]);

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
        
        <Paper elevation={2} sx={{ 
          p: 3, 
          mb: 4,
          bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#ffffff',
          color: theme => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ color: theme => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>
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
            <IconlessAlert severity="error" sx={{ 
              mb: 2,
              borderRadius: 1,
              border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
            }}>
              {error}
            </IconlessAlert>
          )}
          
          {/* Alert for pending orders */}
          {shouldShowPendingAlert && hasPendingOrders && (
            <IconlessAlert severity="warning" sx={{ 
              mb: 3,
              borderRadius: 1,
              border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0',
              bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#fff3cd',
              color: theme => theme.palette.mode === 'dark' ? '#fbbf24' : '#664d03'
            }}>
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
            <IconlessAlert severity="info" sx={{ 
              mb: 3,
              borderRadius: 1,
              border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Order Updates Since Your Last Visit
              </Typography>
              <Typography variant="body2">
                {recentlyChangedOrders.length} {recentlyChangedOrders.length === 1 ? 'order has' : 'orders have'} been updated.
              </Typography>
            </IconlessAlert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit' }}>Shop</InputLabel>
            <Select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              label="Shop"
              size="small"
              sx={{
                color: theme => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.mode === 'dark' ? '#6b7280' : 'inherit',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.mode === 'dark' ? '#9ca3af' : 'inherit',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme => theme.palette.mode === 'dark' ? '#3b82f6' : 'inherit',
                },
                '& .MuiSvgIcon-root': {
                  color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit',
                }
              }}
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
                      <CollapsibleAlert title="Shop Minimum Inventory Requirements" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Espresso bags: {selectedShopDetails.minCoffeeQuantityEspresso} |
                          Filter bags: {selectedShopDetails.minCoffeeQuantityFilter} |
                          Large bags: {selectedShopDetails.minCoffeeQuantityLarge} 
                        </Typography>
                      </CollapsibleAlert>
                    )}
                    
                    {(() => {
                      // Group inventory by coffee grade
                      const groupedInventory = {
                        specialty: [],
                        premium: [],
                        rarity: [],
                        decaf: [],
                        other: []
                      };
                      
                      inventory.forEach(item => {
                        const grade = item.coffee?.grade?.toLowerCase() || '';
                        if (grade.includes('decaf')) {
                          groupedInventory.decaf.push(item);
                        } else if (grade.includes('rarity')) {
                          groupedInventory.rarity.push(item);
                        } else if (grade.includes('specialty')) {
                          groupedInventory.specialty.push(item);
                        } else if (grade.includes('premium')) {
                          groupedInventory.premium.push(item);
                        } else {
                          groupedInventory.other.push(item);
                        }
                      });
                      
                      // Helper function to render inventory rows
                      const renderInventoryRows = (items) => {
                        return items.map((item) => {
                          // Calculate stock status for row styling based only on small bags
                          const numberOfCoffees = availableCoffee.length || 1;
                          
                          const perCoffeeMinEspresso = selectedShopDetails?.minCoffeeQuantityEspresso > 0 ?
                                                       selectedShopDetails.minCoffeeQuantityEspresso / numberOfCoffees : 0;
                          
                          const perCoffeeMinFilter = selectedShopDetails?.minCoffeeQuantityFilter > 0 ?
                                                       selectedShopDetails.minCoffeeQuantityFilter / numberOfCoffees : 0;
                          
                          const espressoBagsPercentage = perCoffeeMinEspresso > 0 ? 
                                                         (item.smallBagsEspresso / perCoffeeMinEspresso) * 100 : 100;
                          
                          const filterBagsPercentage = perCoffeeMinFilter > 0 ? 
                                                         (item.smallBagsFilter / perCoffeeMinFilter) * 100 : 100;
                          
                          const isEspressoBagsLow = perCoffeeMinEspresso > 0 && espressoBagsPercentage < 75 && espressoBagsPercentage >= 50;
                          const isEspressoBagsCritical = perCoffeeMinEspresso > 0 && espressoBagsPercentage < 50;
                          
                          const isFilterBagsLow = perCoffeeMinFilter > 0 && filterBagsPercentage < 75 && filterBagsPercentage >= 50;
                          const isFilterBagsCritical = perCoffeeMinFilter > 0 && filterBagsPercentage < 50;
                          
                          const isCritical = isEspressoBagsCritical || isFilterBagsCritical;
                          const isWarning = (isEspressoBagsLow || isFilterBagsLow) && !isCritical;
                          const rowBgColor = isCritical 
                            ? '#fff8f8'
                            : isWarning 
                              ? '#fffaf0'
                              : '#374151';
                          
                          return (
                            <TableRow 
                              key={item.id} 
                              hover
                              onClick={() => {
                                if (canUpdateInventory) {
                                  handleOpenInventoryDialog(item);
                                }
                              }}
                              sx={{ 
                                bgcolor: rowBgColor,
                                cursor: canUpdateInventory ? 'pointer' : 'default',
                                '&:hover': {
                                  backgroundColor: isCritical 
                                    ? '#fff0f0' 
                                    : isWarning 
                                      ? '#fff5e6' 
                                      : canUpdateInventory
                                        ? theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                                        : undefined
                                }
                              }}
                            >
                              {canUpdateInventory && (
                                <TableCell align="center">
                                  <Tooltip title="Update Inventory">
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenInventoryDialog(item);
                                      }}
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
                              <TableCell align="right">{item.smallBagsEspresso ? item.smallBagsEspresso.toFixed(2) : '0.00'}</TableCell>
                              <TableCell align="right">{item.smallBagsFilter ? item.smallBagsFilter.toFixed(2) : '0.00'}</TableCell>
                              <TableCell align="right">{item.largeBags ? item.largeBags.toFixed(2) : '0.00'}</TableCell>
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
                              <TableCell>
                                <div className="text-sm">
                                  {item.id ? (
                                    <>
                                      <div className="text-green-600 font-medium">In Stock</div>
                                      {item.greenStockAvailable > 0 && (
                                        <div className="text-gray-500 text-xs">
                                          Green stock: {parseFloat(item.greenStockAvailable).toFixed(2)}kg
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-blue-600 font-medium">Available for Order</div>
                                      {item.greenStockAvailable > 0 ? (
                                        <div className="text-gray-500 text-xs">
                                          Green stock: {parseFloat(item.greenStockAvailable).toFixed(2)}kg
                                        </div>
                                      ) : (
                                        <div className="text-gray-400 text-xs">
                                          Out of stock
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      };
                      
                      // Helper function to render summary row
                      const renderSummaryRow = (items) => {
                        if (items.length === 0) return null;
                        
                        return (
                          <TableRow sx={{ 
                            backgroundColor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5', 
                            fontWeight: 'bold',
                            '& .MuiTableCell-root': { 
                              fontWeight: 'bold',
                              borderTop: theme => theme.palette.mode === 'dark' ? '2px solid #6b7280' : '2px solid #e0e0e0',
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit'
                            }
                          }}>
                            {canUpdateInventory && <TableCell />}
                            <TableCell colSpan={2}>
                              <Typography variant="subtitle2">TOTAL</Typography>
                            </TableCell>
                            <TableCell align="right">
                              {items.reduce((sum, item) => sum + (item.smallBagsEspresso || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {items.reduce((sum, item) => sum + (item.smallBagsFilter || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {items.reduce((sum, item) => sum + (item.largeBags || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell colSpan={3} />
                          </TableRow>
                        );
                      };
                      
                      // Render sections
                      const sections = [
                        { key: 'specialty', title: 'Specialty Grade', items: groupedInventory.specialty },
                        { key: 'premium', title: 'Premium Grade', items: groupedInventory.premium },
                        { key: 'rarity', title: 'Rarity Grade', items: groupedInventory.rarity },
                        { key: 'decaf', title: 'Decaf', items: groupedInventory.decaf },
                        { key: 'other', title: 'Other', items: groupedInventory.other }
                      ];
                      
                      return sections.map(section => {
                        if (section.items.length === 0) return null;
                        
                        return (
                          <Box key={section.key} sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                              {section.title} ({section.items.length} coffee{section.items.length !== 1 ? 's' : ''})
                            </Typography>
                            
                            <TableContainer component={Paper} sx={{
                              bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                              border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
                            }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5' }}>
                                  <TableRow>
                                    {canUpdateInventory && (
                                      <TableCell align="center" sx={{ 
                                        color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                        fontWeight: 600
                                      }}>Actions</TableCell>
                                    )}
                                    <TableCell sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Coffee</TableCell>
                                    <TableCell sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Grade</TableCell>
                                    <TableCell align="right" sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Espresso Bags (200g)</TableCell>
                                    <TableCell align="right" sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Filter Bags (200g)</TableCell>
                                    <TableCell align="right" sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Large Bags (1kg)</TableCell>
                                    <TableCell sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Last Order Date</TableCell>
                                    <TableCell sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Stock Status</TableCell>
                                    <TableCell sx={{ 
                                      color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                      fontWeight: 600
                                    }}>Availability</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
                                  {renderInventoryRows(section.items)}
                                  {renderSummaryRow(section.items)}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        );
                      });
                    })()}
                    
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
                          <IconlessAlert severity={alertMessage.type} sx={{ 
                            mb: 2,
                            borderRadius: 1,
                            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
                          }}>
                            {alertMessage.text}
                          </IconlessAlert>
                        )}
                        
                        {recentAlertLogs.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined" sx={{ 
                            mb: 2,
                            bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
                          }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5' }}>
                                <TableRow>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Date</TableCell>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Alert Type</TableCell>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Espresso Bags</TableCell>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Filter Bags</TableCell>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Large Bags</TableCell>
                                  <TableCell sx={{ 
                                    color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                    fontWeight: 600
                                  }}>Emails Sent</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
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
                                      {log.totalEspressoBags} / {log.minEspressoBags} 
                                      ({Math.round(log.espressoBagsPercentage)}%)
                                    </TableCell>
                                    <TableCell>
                                      {log.totalFilterBags} / {log.minFilterBags}
                                      ({Math.round(log.filterBagsPercentage)}%)
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
                    <TableContainer sx={{
                      bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white'
                    }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Date</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Coffee</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Updated By</TableCell>
                            <TableCell align="right" sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Previous Qty</TableCell>
                            <TableCell align="right" sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>New Qty</TableCell>
                            <TableCell align="right" sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Change</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
                          {inventoryHistory.map((item) => (
                            <TableRow key={item.id} hover sx={{
                              bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                              '&:hover': {
                                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                              }
                            }}>
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
                                  Espresso bags: {item.changes?.previousValues?.smallBagsEspresso || 0} → {item.changes?.newValues?.smallBagsEspresso || 0}
                                  <br />
                                  Filter bags: {item.changes?.previousValues?.smallBagsFilter || 0} → {item.changes?.newValues?.smallBagsFilter || 0}
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
                    <PendingOrdersSummary 
                      orders={orders.filter(order => order.status === 'PENDING')} 
                      showShopInfo={true} 
                    />
                  )}
                  
                  <Paper elevation={1} sx={{ 
                    bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                    border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
                  }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ 
                          bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5'
                        }}>
                          <TableRow>
                            <TableCell padding="checkbox" sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }} />
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Date</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Ordered By</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Items</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Total Quantity</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Order ID</TableCell>
                            <TableCell sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Status</TableCell>
                            <TableCell align="right" sx={{ 
                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                              fontWeight: 600
                            }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
                          {orders.map((order) => (
                            <React.Fragment key={order.id}>
                              <TableRow 
                                hover 
                                sx={{ 
                                  bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white',
                                  '&:hover': {
                                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                                  }
                                }}
                              >
                                {/* Expand/Collapse Button */}
                                <TableCell padding="checkbox">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpanded(order.id);
                                    }}
                                    aria-label="expand row"
                                  >
                                    {expandedRows[order.id] ? (
                                      <KeyboardArrowUpIcon />
                                    ) : (
                                      <KeyboardArrowDownIcon />
                                    )}
                                  </IconButton>
                                </TableCell>
                                
                                {/* Details Columns - Click to expand/collapse */}
                                <TableCell 
                                  onClick={() => {
                                    try {
                                      toggleRowExpanded(order.id);
                                    } catch (error) {
                                      console.error('Error toggling row expansion:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {order.createdAt 
                                    ? format(new Date(order.createdAt), 'MMM d, yyyy') 
                                    : 'Unknown'}
                                </TableCell>
                                <TableCell 
                                  onClick={() => {
                                    try {
                                      toggleRowExpanded(order.id);
                                    } catch (error) {
                                      console.error('Error toggling row expansion:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {order.orderedBy?.firstName 
                                    ? `${order.orderedBy.firstName} ${order.orderedBy.lastName || ''}` 
                                    : order.orderedBy?.username || 'Unknown'}
                                </TableCell>
                                <TableCell 
                                  onClick={() => {
                                    try {
                                      toggleRowExpanded(order.id);
                                    } catch (error) {
                                      console.error('Error toggling row expansion:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {order.items?.length || 0}
                                </TableCell>
                                <TableCell 
                                  onClick={() => {
                                    try {
                                      toggleRowExpanded(order.id);
                                    } catch (error) {
                                      console.error('Error toggling row expansion:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {order.items?.reduce((sum, item) => sum + (item.totalQuantity || 0), 0).toFixed(2)} kg
                                </TableCell>
                                <TableCell 
                                  onClick={() => {
                                    try {
                                      toggleRowExpanded(order.id);
                                    } catch (error) {
                                      console.error('Error toggling row expansion:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {order.id.substring(0, 8)}
                                </TableCell>
                                
                                {/* Status Column - Click to open status dialog */}
                                <TableCell 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      handleOpenStatusDialog(order);
                                    } catch (error) {
                                      console.error('Error opening status dialog:', error);
                                    }
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  <StatusChip status={order.status} />
                                </TableCell>
                                
                                {/* Actions Column - Click to open status dialog */}
                                <TableCell align="right">
                                  <Tooltip title="Update Status">
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenStatusDialog(order);
                                      }}
                                      sx={{ cursor: 'pointer' }}
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
                                      
                                      {order.comment && (
                                        <Box 
                                          sx={{ 
                                            mb: 2, 
                                            p: 1.5, 
                                            bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5', 
                                            borderRadius: 1,
                                            border: theme => theme.palette.mode === 'dark' ? '1px solid #6b7280' : '1px solid #e0e0e0'
                                          }}
                                        >
                                          <Typography variant="body2" fontWeight="medium" gutterBottom sx={{ color: theme => theme.palette.mode === 'dark' ? '#f3f4f6' : 'inherit' }}>
                                            Comment:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'inherit' }}>
                                            {order.comment}
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      <Table size="small">
                                        <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#4b5563' : '#f5f5f5' }}>
                                          <TableRow>
                                            <TableCell sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Coffee</TableCell>
                                            <TableCell sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Grade</TableCell>
                                            <TableCell align="right" sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Espresso Bags (200g)</TableCell>
                                            <TableCell align="right" sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Filter Bags (200g)</TableCell>
                                            <TableCell align="right" sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Large Bags (1kg)</TableCell>
                                            <TableCell align="right" sx={{ 
                                              color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : 'rgba(0, 0, 0, 0.6)',
                                              fontWeight: 600
                                            }}>Total Quantity</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : 'white' }}>
                                          {order.items.map((item) => (
                                            <TableRow key={item.id}>
                                              <TableCell>
                                                {item.coffee?.name || 'Unknown Coffee'}
                                              </TableCell>
                                              <TableCell>
                                                {item.coffee?.grade?.replace('_', ' ') || 'Unknown'}
                                              </TableCell>
                                              <TableCell align="right">{item.smallBagsEspresso ? item.smallBagsEspresso.toFixed(2) : '0.00'}</TableCell>
                                              <TableCell align="right">{item.smallBagsFilter ? item.smallBagsFilter.toFixed(2) : '0.00'}</TableCell>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <div>
                      <Typography variant="h6" gutterBottom>
                        {pendingOrdersViewMode === 'shop' ? 'Summary by Shop' : 'Aggregated Summary'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pendingOrdersViewMode === 'shop' 
                          ? 'This table shows pending orders broken down by shop and coffee type.'
                          : 'This table summarizes all pending orders across all shops, grouped by coffee type.'
                        }
                      </Typography>
                    </div>
                    <ToggleButtonGroup
                      value={pendingOrdersViewMode}
                      exclusive
                      onChange={(event, newMode) => {
                        if (newMode !== null) {
                          setPendingOrdersViewMode(newMode);
                        }
                      }}
                      size="small"
                      sx={{ ml: 2 }}
                    >
                      <ToggleButton value="shop">
                        By Shop
                      </ToggleButton>
                      <ToggleButton value="aggregated">
                        Aggregated
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  <PendingOrdersSummary 
                    orders={allPendingOrders} 
                    showShopInfo={pendingOrdersViewMode === 'shop'} 
                    hideHeader={true} 
                    aggregateAcrossShops={pendingOrdersViewMode === 'aggregated'} 
                  />
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
          haircutPercentage={haircutPercentage}
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