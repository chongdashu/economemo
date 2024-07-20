'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Sidebar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <aside className="w-64 p-4 bg-gray-100">
      <nav className="flex flex-col space-y-2">
        <Link href="/articles">Articles</Link>
        <Link href="/heatmap">Heatmap</Link>
      </nav>
    </aside>
  );
}
