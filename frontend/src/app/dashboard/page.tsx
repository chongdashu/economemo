'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ArticleTable from '@/components/ArticleTable';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome to Your Economemo Dashboard</h1>
      {session?.user?.email && (
        <p className="text-lg">You are logged in as <b>{session.user.email}</b></p>
      )}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tracked Articles</h2>
        <ArticleTable />
      </div>
    </div>
  );
}