import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';

function Error({ statusCode }) {
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
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </Typography>
        <Typography variant="body1" paragraph>
          {statusCode
            ? `A server-side error occurred.`
            : 'A client-side error occurred.'}
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 