import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tabs,
  Tab,
  Alert,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from '@/lib/session';
import { format } from 'date-fns';
import RetailOrderDialog from '@/components/retail/RetailOrderDialog';

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

export default function RetailInventory() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [inventory, setInventory] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        setShops(data);
        if (data.length > 0) {
          setSelectedShop(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops');
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedShop) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/retail/inventory?shopId=${selectedShop}`);
        const data = await response.json();
        setInventory(data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [selectedShop]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCreateOrder = () => {
    setOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
    // Refresh inventory after order creation
    if (selectedShop) {
      fetchInventory();
    }
  };

  const grades = Object.keys(inventory);

  if (!session) {
    return null;
  }

  // Check if user is a roaster
  const isRoaster = session.user.role === 'ROASTER';

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Retail Inventory
          </Typography>
          {!isRoaster && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateOrder}
            >
              Create Order
            </Button>
          )}
        </Box>

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

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={handleTabChange}>
                {grades.map((grade, index) => (
                  <Tab key={grade} label={grade.replace('_', ' ')} id={`coffee-grade-tab-${index}`} />
                ))}
              </Tabs>
            </Box>

            {grades.map((grade, index) => (
              <TabPanel key={grade} value={currentTab} index={index}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Coffee Name</TableCell>
                        <TableCell align="right">Small Bags (250g)</TableCell>
                        <TableCell align="right">Large Bags (1kg)</TableCell>
                        <TableCell align="right">Total Quantity (kg)</TableCell>
                        <TableCell>Last Order Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventory[grade].map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.coffee.name}</TableCell>
                          <TableCell align="right">{item.smallBags}</TableCell>
                          <TableCell align="right">{item.largeBags}</TableCell>
                          <TableCell align="right">{item.totalQuantity}</TableCell>
                          <TableCell>
                            {item.lastOrderDate
                              ? format(new Date(item.lastOrderDate), 'PPpp')
                              : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            ))}
          </>
        )}

        <RetailOrderDialog
          open={orderDialogOpen}
          onClose={handleCloseOrderDialog}
        />
      </Container>
    </DashboardLayout>
  );
} 