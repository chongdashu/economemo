import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import axios, { AxiosError } from 'axios';
import ArticleTable from './ArticleTable';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('axios');

// Mock the environment variable
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://test-api.com';

const mockArticles = [
  { id: 1, url: 'https://example.com/article1', read: true, date_read: '2023-07-21' },
  { id: 2, url: 'https://example.org/article2', read: false, date_read: '' },
];

describe('ArticleTable', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { id: '123' } }, status: 'authenticated' });
    (axios.get as jest.Mock).mockResolvedValue({ data: mockArticles });
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

  it('displays error message when fetching fails with AxiosError', async () => {
    const axiosError = new AxiosError();
    axiosError.response = { data: { detail: 'Custom error message' } } as any;
    (axios.get as jest.Mock).mockRejectedValue(axiosError);

    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching articles:', expect.any(AxiosError));
    });
  });

  it('displays generic error message for AxiosError without response data', async () => {
    const axiosError = new AxiosError();
    (axios.get as jest.Mock).mockRejectedValue(axiosError);

    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('An error occurred while fetching articles')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching articles:', expect.any(AxiosError));
    });
  });

  it('displays generic error message for non-Axios errors', async () => {
    const genericError = new Error('Generic error');
    (axios.get as jest.Mock).mockRejectedValue(genericError);

    render(<ArticleTable />);
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching articles:', expect.any(Error));
    });
  });

  it('uses the correct API base URL', async () => {
    render(<ArticleTable />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://test-api.com/articles',
        expect.objectContaining({
          headers: { 'User-Id': '123' },
        })
      );
    });
  });
});