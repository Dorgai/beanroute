import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save as SaveIcon,
  BookmarkBorder as TemplateIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useSession } from '@/lib/session';

export default function OrderDialogWithTemplates({ 
  open, 
  onClose, 
  coffeeItems, 
  selectedShop, 
  haircutPercentage,
  refreshData 
}) {
  // Remove theme dependency for now to avoid context issues
  const isDark = false;
  const { session } = useSession();
  
  // Component state logging (minimal)
  if (open) {
    console.log('OrderDialogWithTemplates: Dialog opened with', coffeeItems?.length, 'coffee items');
  }
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [comment, setComment] = useState('');
  const [pendingOrdersData, setPendingOrdersData] = useState({});
  
  // Template-related state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateIsPublic, setTemplateIsPublic] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Initialize order items and fetch templates when dialog opens
  useEffect(() => {
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
      setError(null);
      setSelectedTemplate('');
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      
      // Fetch templates
      fetchTemplates();
    } else if (open) {
      console.warn('No valid coffee items available for ordering');
      setError(null);
    }
  }, [open, coffeeItems, selectedShop]);

  // Fetch pending orders data
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

  // Fetch order templates
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const url = selectedShop 
        ? `/api/retail/order-templates?shopId=${selectedShop}`
        : '/api/retail/order-templates';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load template into order form
  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newOrderItems = {};
    
    // Initialize all coffee items to empty
      coffeeItems.forEach(coffee => {
      if (coffee && coffee.id) {
        newOrderItems[coffee.id] = { 
          smallBagsEspresso: '', 
            smallBagsFilter: '', 
          largeBags: '' 
        };
      }
    });

    // Apply template values, but allow user to modify them
    template.items.forEach(item => {
      if (newOrderItems[item.coffeeId]) {
        // Check if coffee is still available
        const coffee = coffeeItems.find(c => c.id === item.coffeeId);
        const isAvailable = coffee && coffee.quantity > 0;
        
        newOrderItems[item.coffeeId] = {
          smallBagsEspresso: isAvailable ? (item.smallBagsEspresso || '') : '',
          smallBagsFilter: isAvailable ? (item.smallBagsFilter || '') : '',
          largeBags: isAvailable ? (item.largeBags || '') : ''
        };
      }
    });

    setOrderItems(newOrderItems);
    
    // Validate all items after loading template
    Object.keys(newOrderItems).forEach(coffeeId => {
      const item = newOrderItems[coffeeId];
      const espresso = parseInt(item.smallBagsEspresso) || 0;
      const filter = parseInt(item.smallBagsFilter) || 0;
      const large = parseInt(item.largeBags) || 0;
      
      if (espresso > 0 || filter > 0 || large > 0) {
        validateQuantity(coffeeId, espresso, filter, large);
      }
    });
    
    setSelectedTemplate(templateId);
  };

  // Save current order as template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    // Get items with quantities
    const items = Object.entries(orderItems)
      .filter(([_, item]) => 
        (parseInt(item.smallBagsEspresso) || 0) > 0 ||
        (parseInt(item.smallBagsFilter) || 0) > 0 ||
        (parseInt(item.largeBags) || 0) > 0
      )
      .map(([coffeeId, item]) => ({
        coffeeId,
        smallBagsEspresso: parseInt(item.smallBagsEspresso) || 0,
        smallBagsFilter: parseInt(item.smallBagsFilter) || 0,
        largeBags: parseInt(item.largeBags) || 0
      }));

    if (items.length === 0) {
      setError('Cannot save empty template. Please add some items first.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/retail/order-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          shopId: selectedShop,
          items,
          isPublic: templateIsPublic
        }),
      });

      if (response.ok) {
        setShowSaveTemplate(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateIsPublic(false);
        await fetchTemplates(); // Refresh templates list
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  // Delete template
  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/retail/order-templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates(); // Refresh templates list
        if (selectedTemplate === templateId) {
          setSelectedTemplate('');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  // Calculate total quantity for a coffee item in kg
  const calculateTotalQuantity = (smallBagsEspresso, smallBagsFilter, largeBags) => {
    return ((smallBagsEspresso + smallBagsFilter) * 0.2) + (largeBags * 1.0);
  };

  // Validate quantity
  const validateQuantity = (coffeeId, smallBagsEspresso, smallBagsFilter, largeBags) => {
    const coffee = coffeeItems.find(c => c.id === coffeeId);
    if (!coffee) return true;
    
    const requestedQuantity = calculateTotalQuantity(smallBagsEspresso, smallBagsFilter, largeBags);
    const realTimeAvailable = calculateRealTimeAvailableQuantity(coffee);
    const isValid = realTimeAvailable >= requestedQuantity;
    
    setValidationErrors(prev => ({
      ...prev,
      [coffeeId]: isValid ? null : `Exceeds available quantity (${realTimeAvailable.toFixed(2)}kg)`
    }));
    
    return isValid;
  };

  // Calculate real-time available quantity
  const calculateRealTimeAvailableQuantity = (coffee) => {
    if (!coffee || typeof coffee.quantity !== 'number') return 0;
    
    let availableQuantity = coffee.quantity;
    
    const currentOrder = orderItems[coffee.id];
    if (currentOrder) {
      const espressoInput = parseInt(currentOrder.smallBagsEspresso) || 0;
      const filterInput = parseInt(currentOrder.smallBagsFilter) || 0;
      const largeBagsInput = parseInt(currentOrder.largeBags) || 0;
      
      const currentOrderQuantity = calculateTotalQuantity(espressoInput, filterInput, largeBagsInput);
      availableQuantity -= currentOrderQuantity;
    }
    
    return Math.max(0, availableQuantity);
  };

  // Handle quantity change
  const handleQuantityChange = (coffeeId, field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setOrderItems(prev => {
      const updated = {
        ...prev,
        [coffeeId]: {
          ...prev[coffeeId],
          [field]: numericValue
        }
      };
      
      // Validate after update
      const item = updated[coffeeId];
      const espresso = parseInt(item.smallBagsEspresso) || 0;
      const filter = parseInt(item.smallBagsFilter) || 0;
      const large = parseInt(item.largeBags) || 0;
      
      validateQuantity(coffeeId, espresso, filter, large);
      
      return updated;
    });
  };

  // Handle order submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedShop) {
        setError('Please select a shop');
        return;
      }

      const items = Object.entries(orderItems)
        .filter(([_, item]) => 
          (parseInt(item.smallBagsEspresso) || 0) > 0 ||
          (parseInt(item.smallBagsFilter) || 0) > 0 ||
          (parseInt(item.largeBags) || 0) > 0
        )
        .map(([coffeeId, item]) => ({
          coffeeId,
          smallBagsEspresso: parseInt(item.smallBagsEspresso) || 0,
          smallBagsFilter: parseInt(item.smallBagsFilter) || 0,
          largeBags: parseInt(item.largeBags) || 0
        }));

      if (items.length === 0) {
        setError('Please add at least one item to the order');
        return;
      }

      const hasValidationErrors = Object.values(validationErrors).some(error => error !== null);
      if (hasValidationErrors) {
        setError('Please correct the quantity errors before submitting');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order');
      }

      // Success - close dialog and refresh data
      onClose(true);
      if (refreshData) refreshData();
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to create order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!Array.isArray(coffeeItems) || coffeeItems.length === 0) {
    return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Order</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            No coffee items available for ordering. Please check your inventory.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create Order</Typography>
          <Box>
            <Tooltip title="Save as Template">
              <IconButton 
                onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                color={showSaveTemplate ? "primary" : "default"}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Template Selection */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <TemplateIcon sx={{ mr: 1 }} />
              <Typography>Order Templates</Typography>
              {templates.length > 0 && (
                <Chip 
                  label={templates.length} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {templatesLoading ? (
              <Typography>Loading templates...</Typography>
            ) : templates.length > 0 ? (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => loadTemplate(e.target.value)}
                    label="Select Template"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                          <Box>
                            <Typography variant="body2">
                              {template.name}
                              {template.isPublic && (
                                <Chip label="Public" size="small" sx={{ ml: 1 }} />
                              )}
                              <Chip 
                                label={`${template.items.length} items`} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }} 
                              />
                            </Typography>
                            {template.description && (
                              <Typography variant="caption" color="textSecondary">
                                {template.description}
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplate(template.id);
                              }}
                              disabled={template.createdBy.id !== session?.user?.id}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedTemplate && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Template loaded! You can modify any quantities before submitting. 
                    Out-of-stock items have been cleared automatically.
                  </Alert>
                )}
              </Box>
            ) : (
              <Typography color="textSecondary">
                No templates available. Create your first template by filling out an order and clicking the save button.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Save Template Section */}
        {showSaveTemplate && (
          <Paper sx={{ p: 2, mb: 2, backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              Save Current Order as Template
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setTemplateIsPublic(!templateIsPublic)}
                  >
                    {templateIsPublic ? 'Public Template' : 'Private Template'}
                  </Button>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => setShowSaveTemplate(false)}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={saveAsTemplate}
                      disabled={loading || !templateName.trim()}
                    >
                      Save Template
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Order Items Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Coffee</TableCell>
                <TableCell align="center">Available (kg)</TableCell>
                <TableCell align="center">Small Espresso (200g)</TableCell>
                <TableCell align="center">Small Filter (200g)</TableCell>
                <TableCell align="center">Large Bags (1kg)</TableCell>
                <TableCell align="center">Total (kg)</TableCell>
                <TableCell align="center">Pending Orders</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coffeeItems.map((coffee) => {
                const orderItem = orderItems[coffee.id] || {};
                const espresso = parseInt(orderItem.smallBagsEspresso) || 0;
                const filter = parseInt(orderItem.smallBagsFilter) || 0;
                const large = parseInt(orderItem.largeBags) || 0;
                const totalQuantity = calculateTotalQuantity(espresso, filter, large);
                const availableQuantity = calculateRealTimeAvailableQuantity(coffee);
                const validationError = validationErrors[coffee.id];
                const pendingOrder = pendingOrdersData[coffee.id];

                const isOutOfStock = coffee.quantity <= 0;
                const isLowStock = coffee.quantity > 0 && coffee.quantity < 5;

                return (
                  <TableRow 
                    key={coffee.id}
                    sx={{ 
                      opacity: isOutOfStock ? 0.5 : 1,
                      backgroundColor: isOutOfStock ? (isDark ? '#2a1a1a' : '#f5f5f5') : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={isOutOfStock ? 'textSecondary' : 'textPrimary'}
                        >
                          {coffee.name}
                          {isOutOfStock && (
                            <Chip 
                              label="Out of Stock" 
                              size="small" 
                              color="error" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                          {isLowStock && (
                            <Chip 
                              label="Low Stock" 
                              size="small" 
                              color="warning" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {coffee.grade} • {coffee.country}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        color={isOutOfStock ? 'error' : availableQuantity < 5 ? 'warning.main' : 'textPrimary'}
                        fontWeight={isOutOfStock ? 'bold' : 'normal'}
                      >
                        {isOutOfStock ? '0.00' : availableQuantity.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        value={orderItem.smallBagsEspresso || ''}
                        onChange={(e) => handleQuantityChange(coffee.id, 'smallBagsEspresso', e.target.value)}
                        disabled={isOutOfStock}
                        inputProps={{ 
                          style: { textAlign: 'center', width: '60px' },
                          inputMode: 'numeric'
                        }}
                        error={!!validationError}
                        placeholder={isOutOfStock ? "N/A" : "0"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        value={orderItem.smallBagsFilter || ''}
                        onChange={(e) => handleQuantityChange(coffee.id, 'smallBagsFilter', e.target.value)}
                        disabled={isOutOfStock}
                        inputProps={{ 
                          style: { textAlign: 'center', width: '60px' },
                          inputMode: 'numeric'
                        }}
                        error={!!validationError}
                        placeholder={isOutOfStock ? "N/A" : "0"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="text"
                        value={orderItem.largeBags || ''}
                        onChange={(e) => handleQuantityChange(coffee.id, 'largeBags', e.target.value)}
                        disabled={isOutOfStock}
                        inputProps={{ 
                          style: { textAlign: 'center', width: '60px' },
                          inputMode: 'numeric'
                        }}
                        error={!!validationError}
                        placeholder={isOutOfStock ? "N/A" : "0"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        color={validationError ? 'error' : 'textPrimary'}
                        fontWeight={totalQuantity > 0 ? 'medium' : 'normal'}
                      >
                        {totalQuantity.toFixed(2)}
                      </Typography>
                      {validationError && (
                        <Typography variant="caption" color="error">
                          {validationError}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {pendingOrder ? (
                        <Chip 
                          label={`${pendingOrder.totalQuantity.toFixed(1)}kg`}
                          size="small"
                          color="warning"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Comment Section */}
        <TextField
          fullWidth
          label="Comment (optional)"
          multiline
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 2 }}
          inputProps={{ maxLength: 200 }}
          helperText={`${comment.length}/200 characters`}
        />
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2, pb: 2 }}>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button 
          onClick={() => setShowSaveTemplate(!showSaveTemplate)}
          startIcon={<SaveIcon />}
          disabled={
            !selectedShop || 
            !Array.isArray(coffeeItems) || 
            coffeeItems.length === 0
          }
        >
          Save as Template
        </Button>
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
