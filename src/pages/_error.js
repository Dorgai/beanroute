import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';
import Head from 'next/head';

function Error({ statusCode, title, message }) {
  const errorTitle = title || (statusCode ? `Error ${statusCode}` : 'An error occurred');
  const errorMessage = message || (statusCode
    ? 'A server-side error occurred.'
    : 'A client-side error occurred.');

  return (
    <>
      <Head>
        <title>{errorTitle} | Bean Route</title>
      </Head>
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            padding: 4,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
            {errorTitle}
          </Typography>
          <Typography variant="body1" paragraph>
            {errorMessage}
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { 
    statusCode,
    title: err?.title,
    message: err?.message
  };
};

export default Error; 