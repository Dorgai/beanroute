import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  
  return (
    <>
      <Head>
        <title>User Management System</title>
        <meta name="description" content="User Management System with Authentication and Access Control" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {isLoginPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
} 