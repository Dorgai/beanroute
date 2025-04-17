import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Bean Route</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: 4,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
            404 - Page Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/dashboard"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              component={Link}
              href="/"
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
} 