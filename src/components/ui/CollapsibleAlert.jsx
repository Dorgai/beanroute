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
    <Alert 
      severity={severity} 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        },
        ...sx 
      }}
      icon={<InfoIcon />}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold',
            cursor: 'pointer',
            flex: 1
          }}
          onClick={handleToggle}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={handleToggle}
          sx={{ 
            ml: 1,
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
        <Box sx={{ mt: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Alert>
  );
}
