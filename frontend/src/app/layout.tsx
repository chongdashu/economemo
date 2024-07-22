import './globals.css';
import { Providers } from './providers';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className="flex min-h-screen bg-background text-foreground"
        suppressHydrationWarning={true}
      >
        <Providers>
          <div className="flex flex-col w-full">
            <NavBar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-4 overflow-auto">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}