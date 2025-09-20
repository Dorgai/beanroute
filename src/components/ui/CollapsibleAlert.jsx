import React, { useState } from 'react';
import {
  Alert,
  IconButton,
  Collapse,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';

/**
 * A collapsible alert component that shows a summary and can be expanded to show full content
 * @param {Object} props
 * @param {string} props.title - The title/summary text shown when collapsed
 * @param {React.ReactNode} props.children - The content to show when expanded
 * @param {string} props.severity - Alert severity (info, warning, error, success)
 * @param {Object} props.sx - Additional styling
 * @param {boolean} props.defaultExpanded - Whether to start expanded (default: false)
 */
export default function CollapsibleAlert({ 
  title, 
  children, 
  severity = 'info', 
  sx = {}, 
  defaultExpanded = false 
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 1.5,
          backgroundColor: severity === 'info' ? '#e3f2fd' : 
                          severity === 'warning' ? '#fff3e0' :
                          severity === 'error' ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${severity === 'info' ? '#2196f3' : 
                               severity === 'warning' ? '#ff9800' :
                               severity === 'error' ? '#f44336' : '#4caf50'}`,
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: severity === 'info' ? '#bbdefb' : 
                            severity === 'warning' ? '#ffe0b2' :
                            severity === 'error' ? '#ffcdd2' : '#c8e6c9'
          }
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <InfoIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 'bold',
              color: severity === 'info' ? '#1565c0' : 
                     severity === 'warning' ? '#e65100' :
                     severity === 'error' ? '#c62828' : '#2e7d32'
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          sx={{ 
            p: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ 
          mt: 1,
          p: 1.5,
          backgroundColor: severity === 'info' ? '#f3f9ff' : 
                          severity === 'warning' ? '#fffbf5' :
                          severity === 'error' ? '#fff5f5' : '#f1f8e9',
          border: `1px solid ${severity === 'info' ? '#90caf9' : 
                               severity === 'warning' ? '#ffcc02' :
                               severity === 'error' ? '#ef9a9a' : '#a5d6a7'}`,
          borderRadius: 1,
          borderTop: 'none'
        }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
