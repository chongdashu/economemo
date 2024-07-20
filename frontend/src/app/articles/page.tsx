'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { getSession } from 'next-auth/react';

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
      {error && <p className="text-red-500">{error}</p>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Article
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Read Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {articles.map((article) => (
            <tr key={article.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {article.url.split('/').pop()}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(article.date_read).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
