import './globals.css';
import { Providers } from './providers';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Providers>
          <div className="flex flex-col w-full">
            <NavBar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-4">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
