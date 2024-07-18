'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar } from '@ant-design/plots';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Heatmap = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles`, {
        headers: { 'User-Id': userId },
      });

      const transformedData = response.data.map((article) => ({
        date: new Date(article.date_read).toISOString().split('T')[0],
        value: 1,
      }));

      setData(transformedData);
    };

    fetchData();
  }, [userId, router]);

  const config = {
    data,
    width: 600,
    height: 400,
    autoFit: false,
    padding: [50, 30, 50, 30],
    timeRange: ['2024-01-01', '2024-12-31'],
    xField: 'date',
    yField: 'value',
    calendar: {
      cellPadding: 2,
      cellSize: 20,
    },
  };

  return (
    <div>
      <h1>Heatmap</h1>
      <Calendar {...config} />
    </div>
  );
};

export default Heatmap;
