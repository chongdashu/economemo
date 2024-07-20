'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between p-4 bg-gray-200">
      <div className="space-x-4">
        <Link href="/">Home</Link>
      </div>
      <div className="space-x-4">
        {!session ? (
          <Link href="/login">Login</Link>
        ) : (
          <>
            <button onClick={() => signOut()}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
