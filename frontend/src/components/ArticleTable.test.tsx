import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import axios from '@/lib/axios';
import ArticleTable from './ArticleTable';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/lib/axios', () => ({
  get: jest.fn(),
  isAxiosError: jest.fn(),
}));

const mockArticles = [
  { id: 1, url: 'https://example.com/article1', read: true, date_read: '2023-07-21' },
  { id: 2, url: 'https://example.com/article2', read: false, date_read: '' },
];

describe('ArticleTable', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { id: '123' } }, status: 'authenticated' });
    (axios.get as jest.Mock).mockResolvedValue({ data: mockArticles });
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
  });

  it('renders articles when fetched successfully', async () => {
    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('article1')).toBeInTheDocument();
      expect(screen.getByText('article2')).toBeInTheDocument();
    });
  });

  it('displays error message when fetching fails', async () => {
    const axiosError = new Error('Failed to fetch') as any;
    axiosError.response = { data: { detail: 'Custom error message' } };
    (axios.get as jest.Mock).mockRejectedValue(axiosError);

    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
});
