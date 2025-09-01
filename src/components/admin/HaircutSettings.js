import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';

const HaircutSettings = () => {
  const [haircutInfo, setHaircutInfo] = useState(null);
  const [newPercentage, setNewPercentage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHaircutInfo();
  }, []);

  const fetchHaircutInfo = async () => {
    try {
      const response = await fetch('/api/admin/haircut-settings');
      if (response.ok) {
        const data = await response.json();
        setHaircutInfo(data);
        setNewPercentage(data.percentage.toString());
      } else {
        setError('Failed to fetch haircut settings');
      }
    } catch (err) {
      setError('Error fetching haircut settings: ' + err.message);
    }
  };

  const handleSave = async () => {
    const percentage = parseFloat(newPercentage);
    
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError('Please enter a valid percentage between 0 and 100');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/haircut-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentage }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setHaircutInfo(data.haircutInfo);
        setNewPercentage(data.haircutInfo.percentage.toString());
      } else {
        setError(data.error || 'Failed to update haircut percentage');
      }
    } catch (err) {
      setError('Error updating haircut percentage: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (haircutInfo) {
      setNewPercentage(haircutInfo.percentage.toString());
    }
    setError(null);
    setMessage(null);
  };

  if (!haircutInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading haircut settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Coffee Processing Haircut Settings
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure the processing loss percentage applied when converting green coffee to retail products.
      </Typography>

      {/* Current Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Settings
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Haircut Percentage:
              </Typography>
              <Chip 
                label={`${haircutInfo.percentage}%`}
                color="primary"
                size="medium"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Multiplier:
              </Typography>
              <Chip 
                label={`${(1 + haircutInfo.percentage / 100).toFixed(3)}x`}
                color="secondary"
                size="medium"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Update Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Update Haircut Percentage
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Haircut Percentage (%)"
                type="number"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                helperText="Enter a value between 0 and 100"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading || newPercentage === haircutInfo.percentage.toString()}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            How It Works
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {haircutInfo.description}
          </Typography>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Examples:
          </Typography>
          
          <Grid container spacing={2}>
            {haircutInfo.examples.map((example, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Retail Order:</strong> {example.retailOrdered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Haircut:</strong> {example.haircutAmount}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    <strong>Total Green Consumption:</strong> {example.totalGreenConsumption}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default HaircutSettings;
