'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactCalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useSession } from 'next-auth/react';

interface Article {
  date_read: string;
}

const Heatmap = () => {
  const { data: session, status } = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchData = async () => {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles`, {
          headers: { 'User-Id': session.user.id },
        });

        const transformedData = response.data.map((article: Article) => ({
          date: new Date(article.date_read).toISOString().split('T')[0],
          count: 1,
        }));

        setData(transformedData);
      };

      fetchData();
    }
  }, [session, status]);

  return (
    <div>
      <h1>Heatmap</h1>
      <ReactCalendarHeatmap
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-12-31')}
        values={data}
        classForValue={(value) => {
          if (!value) {
            return 'color-empty';
          }
          return `color-scale-${value.count}`;
        }}
      />
    </div>
  );
};

export default Heatmap;
