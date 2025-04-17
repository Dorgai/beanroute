import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';
import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | Bean Route</title>
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
            500 - Server Error
          </Typography>
          <Typography variant="body1" paragraph>
            Sorry, there was a problem on our server. Please try again later.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Reload page
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