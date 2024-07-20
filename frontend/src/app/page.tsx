'use client';

import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div>
      {status === 'authenticated' ? (
        <div>
          <h1>Welcome to Economemo</h1>
          <p>You are logged in as <b>{session.user?.email}</b></p>
        </div>
      ) : (
        <div>
          <h1>Welcome to Economemo</h1>
          <p>Log in to access your tracked articles.</p>
        </div>
      )}
    </div>
  );
}
