'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Article {
  id: number;
  url: string;
  read: boolean;
  date_read: string;
}

const ArticleTable = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    const fetchArticles = async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles`, {
        headers: { 'User-Id': userId },
      });
      setArticles(response.data);
    };

    fetchArticles();
  }, [userId, router]);

  return (
    <div>
      <h1>Articles</h1>
      <table className="min-w-full leading-normal">
        <thead>
          <tr>
            <th>URL</th>
            <th>Read</th>
            <th>Date Read</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.url}</td>
              <td>{article.read ? 'Yes' : 'No'}</td>
              <td>{article.date_read}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleTable;
