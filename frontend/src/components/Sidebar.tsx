'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Calendar } from 'lucide-react';

export default function Sidebar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <aside className="w-64 p-4 bg-background border-r h-full">
      <nav className="flex flex-col space-y-2">
        <Button variant="ghost" className="justify-start" asChild>
          <Link href="/articles">
            <FileText className="mr-2 h-4 w-4" />
            Articles
          </Link>
        </Button>
        <Button variant="ghost" className="justify-start" asChild>
          <Link href="/heatmap">
            <Calendar className="mr-2 h-4 w-4" />
            Heatmap
          </Link>
        </Button>
      </nav>
    </aside>
  );
}
