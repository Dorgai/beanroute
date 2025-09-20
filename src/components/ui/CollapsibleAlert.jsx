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
          backgroundColor: '#f5f5f5',
          border: `1px solid #e0e0e0`,
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#eeeeee'
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
              color: '#333333'
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
          backgroundColor: '#f5f5f5',
          border: `1px solid #e0e0e0`,
          borderRadius: 1,
          borderTop: 'none'
        }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
