'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { getSession } from 'next-auth/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Article {
  id: number;
  url: string;
  read: boolean;
  date_read: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      const session = await getSession();
      if (!session) {
        setError('User is not authenticated');
        return;
      }

      try {
        const response = await axios.get('/articles', {
          headers: { 'User-Id': session.user.id }
        });
        setArticles(response.data);
      } catch (error) {
        console.error('Error fetching articles:', error);
        if (axios.isAxiosError(error)) {
          setError(error.response?.data.detail || 'An error occurred');
        } else {
          setError('An error occurred');
        }
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Read Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id}>
              <TableCell>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {article.url.split('/').pop()}
                </a>
              </TableCell>
              <TableCell>{new Date(article.date_read).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}