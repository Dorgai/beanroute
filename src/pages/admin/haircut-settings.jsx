import React from 'react';
import { getServerSession } from '@/lib/session';
import HaircutSettings from '@/components/admin/HaircutSettings';

export default function HaircutSettingsPage({ initialSession }) {
  return <HaircutSettings />;
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Only allow ADMIN and OWNER roles
  if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
    },
  };
}
