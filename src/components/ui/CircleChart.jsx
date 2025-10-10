import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

/**
 * Simple circle chart component showing percentage as a filled circle
 * @param {Object} props
 * @param {number} props.percentage - Percentage value (0-100)
 * @param {string} props.label - Label for the chart
 * @param {number} props.value - Current value
 * @param {number} props.minimum - Minimum required value
 * @param {string} props.color - Color for the filled portion
 * @param {boolean} props.isDark - Dark theme flag
 * @param {boolean} props.isCritical - Whether this is a critical state
 * @param {boolean} props.isWarning - Whether this is a warning state
 */
export default function CircleChart({ 
  percentage, 
  label, 
  value, 
  minimum,
  color, 
  isDark, 
  isCritical, 
  isWarning 
}) {
  const size = 60; // Circle size
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine colors based on state
  const getColors = () => {
    if (isCritical) {
      return {
        fill: '#ff1744',
        background: isDark ? '#374151' : '#e0e0e0',
        text: '#ff1744'
      };
    } else if (isWarning) {
      return {
        fill: '#ff8000',
        background: isDark ? '#374151' : '#e0e0e0',
        text: '#ff8000'
      };
    } else {
      return {
        fill: color || (isDark ? '#10b981' : '#059669'),
        background: isDark ? '#374151' : '#e0e0e0',
        text: isDark ? '#10b981' : '#059669'
      };
    }
  };

  const colors = getColors();

  // Create tooltip content
  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {label} Bags
      </Typography>
      <Typography variant="body2">
        Current: {value} bags
      </Typography>
      <Typography variant="body2">
        Minimum: {minimum} bags
      </Typography>
      <Typography variant="body2">
        Status: {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Good'}
      </Typography>
      {isCritical && (
        <Typography variant="body2" sx={{ color: '#ff1744', fontWeight: 'bold', mt: 0.5 }}>
          ⚠️ Below minimum requirement
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip 
      title={tooltipContent}
      placement="top"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#ffffff' : '#000000',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            '& .MuiTooltip-arrow': {
              color: isDark ? '#1f2937' : '#ffffff',
            }
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minWidth: '80px',
        cursor: 'pointer'
      }}>
        {/* Circle Chart */}
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.background}
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.fill}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.3s ease-in-out'
              }}
            />
          </svg>
          {/* Center text */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: colors.text,
                lineHeight: 1
              }}
            >
              {Math.round(percentage)}%
            </Typography>
          </Box>
        </Box>
        
        {/* Label */}
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.7rem',
            fontWeight: 'medium',
            color: isDark ? '#d1d5db' : '#374151',
            textAlign: 'center',
            mt: 0.5,
            lineHeight: 1.2
          }}
        >
          {label}
        </Typography>
        
        {/* Value */}
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.65rem',
            color: colors.text,
            fontWeight: 'bold',
            textAlign: 'center',
            mt: 0.25
          }}
        >
          {value}
        </Typography>
      </Box>
    </Tooltip>
  );
}
