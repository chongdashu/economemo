'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center p-4 bg-background border-b">
      <div className="space-x-4">
        <Link href="/" className="text-lg font-semibold hover:text-primary">
          Home
        </Link>
        {session && (
          <Link href="/dashboard" className="text-lg font-semibold hover:text-primary">
            Dashboard
          </Link>
        )}
      </div>
      <div className="space-x-4">
        {!session ? (
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        ) : (
          <>
            <span className="mr-4">Logged in as {session.user?.email}</span>
            <Button variant="outline" onClick={() => signOut()}>
              Logout
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
