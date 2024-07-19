import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import './globals.css';

export const metadata = {
  title: 'Economemo',
  description: 'Track your Economist articles',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="bg-gray-200 py-4 shadow">
          <div className="container mx-auto flex justify-between items-center px-4">
            <nav className="flex space-x-4">
              <Link href="/" className="text-lg font-semibold">
                Home
              </Link>
              <Link href="/articles" className="text-lg font-semibold">
                Articles
              </Link>
              <Link href="/heatmap" className="text-lg font-semibold">
                Heatmap
              </Link>
            </nav>
            <div>
              {session ? (
                <Link href="/api/auth/signout" className="text-lg font-semibold">
                  Logout
                </Link>
              ) : (
                <Link href="/login" className="text-lg font-semibold">
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex flex-1">
          <aside className="w-64 bg-gray-100 p-4 shadow">
            <nav className="flex flex-col space-y-4">
              <Link href="/articles" className="text-lg font-semibold">
                Articles
              </Link>
              <Link href="/heatmap" className="text-lg font-semibold">
                Heatmap
              </Link>
            </nav>
          </aside>
          <div className="flex-1 p-4">{children}</div>
        </main>
      </body>
    </html>
  );
}
