import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export default async function NavBar() {
  const session = await getServerSession(authOptions);

  return (
    <nav>
      <Link href="/">Home</Link>
      {session ? (
        <>
          <Link href="/articles">Articles</Link>
          <Link href="/heatmap">Heatmap</Link>
          <Link href="/api/auth/signout">Logout</Link>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
}
