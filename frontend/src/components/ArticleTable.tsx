'use client';
import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useSession } from 'next-auth/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: number;
  url: string;
  read: boolean;
  date_read: string;
}

const ArticleTable: React.FC = () => {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!session) {
        setError('User is not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/articles', {
          headers: { 'User-Id': session.user.id },
        });
        setArticles(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching articles:', error);
        if (axios.isAxiosError(error)) {
          setError(error.response?.data.detail || 'An error occurred while fetching articles');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [session]);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Article</TableHead>
          <TableHead>Read</TableHead>
          <TableHead>Date Read</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles.map((article) => (
          <TableRow key={article.id}>
            <TableCell>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {getHostname(article.url)}
              </a>
            </TableCell>
            <TableCell>{article.read ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              {article.date_read ? new Date(article.date_read).toLocaleDateString() : 'Not read yet'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ArticleTable;
