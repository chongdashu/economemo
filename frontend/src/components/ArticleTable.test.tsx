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
  { id: 2, url: 'https://example.org/article2', read: false, date_read: '' },
];

describe('ArticleTable', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { id: '123' } }, status: 'authenticated' });
    (axios.get as jest.Mock).mockResolvedValue({ data: mockArticles });
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders articles when fetched successfully', async () => {
    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('example.org')).toBeInTheDocument();
    });
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('7/21/2023')).toBeInTheDocument();
    expect(screen.getByText('Not read yet')).toBeInTheDocument();
  });

  it('displays error message when fetching fails', async () => {
    const axiosError = new Error('Failed to fetch') as any;
    axiosError.response = { data: { detail: 'Custom error message' } };
    (axios.get as jest.Mock).mockRejectedValue(axiosError);

    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching articles:', expect.any(Error));
    });
  });
});
