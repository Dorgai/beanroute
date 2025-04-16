import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';

export default function Custom500() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          500 - Server Error
        </Typography>
        <Typography variant="body1" paragraph>
          An error occurred on the server. Please try again later.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          href="/dashboard"
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
} 