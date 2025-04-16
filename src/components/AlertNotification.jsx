import React, { useState } from 'react';

/**
 * A reusable alert notification component that can be used across the application
 * 
 * @param {Object} props Component props
 * @param {string} props.severity The severity of the alert (error, warning, info, success)
 * @param {string} props.message The main message to display
 * @param {string} [props.title] Optional title for the alert
 * @param {boolean} [props.dismissible=false] Whether the alert can be dismissed
 * @param {boolean} [props.icon=true] Whether to show the severity icon
 * @param {Object} [props.sx] Additional styles to apply to the alert container
 * @param {function} [props.onClose] Callback when alert is closed (if dismissible)
 */
export default function AlertNotification({
  severity = 'info',
  message,
  title,
  dismissible = false,
  icon = true,
  sx = {},
  onClose,
}) {
  const [dismissed, setDismissed] = useState(false);

  // Return null if the alert has been dismissed
  if (dismissed) {
    return null;
  }

  // Define styles and icons based on severity
  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      iconColor: 'text-blue-400',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      iconColor: 'text-green-400',
    },
  };

  const styles = severityStyles[severity] || severityStyles.info;

  // Define icons based on severity
  const icons = {
    error: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${styles.iconColor}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
          clipRule="evenodd" 
        />
      </svg>
    ),
    warning: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${styles.iconColor}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
    ),
    info: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${styles.iconColor}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
    ),
    success: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 ${styles.iconColor}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
          clipRule="evenodd" 
        />
      </svg>
    ),
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  // Convert sx style object to inline style if provided
  const customStyles = Object.keys(sx).length > 0 ? sx : {};

  return (
    <div 
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-md p-4 mb-4`}
      style={customStyles}
    >
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0 mr-3">
            {icons[severity]}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">
            {message}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${styles.bg} ${styles.text} hover:${styles.bg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${styles.bg} focus:ring-${styles.border}`}
                onClick={handleDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg 
                  className="h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 