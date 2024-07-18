'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const NavBar = () => {
  const { userId, email, logout } = useAuth();

  return (
    <nav>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/articles">Articles</Link></li>
        <li><Link href="/heatmap">Heatmap</Link></li>
        {userId ? (
          <>
            <li>{email}</li>
            <li><button onClick={logout}>Logout</button></li>
          </>
        ) : (
          <li><Link href="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
