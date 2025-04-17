import { Alert } from '@mui/material';
import { forwardRef } from 'react';

/**
 * A wrapper around Material-UI Alert component that removes the icon
 */
const IconlessAlert = forwardRef((props, ref) => {
  return <Alert ref={ref} icon={false} {...props} />;
});

IconlessAlert.displayName = 'IconlessAlert';

export default IconlessAlert; 