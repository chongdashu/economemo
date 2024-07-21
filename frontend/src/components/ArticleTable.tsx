'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useSession } from 'next-auth/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Article {
  id: number;
  url: string;
  read: boolean;
  date_read: string;
}

const ArticleTable = () => {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
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
  }, [session]);

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
  );
};

export default ArticleTable;