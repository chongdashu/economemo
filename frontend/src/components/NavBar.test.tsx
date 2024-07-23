import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import NavBar from '@/components/NavBar';

// Mock the next-auth useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('NavBar', () => {
  it('renders login button when user is not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<NavBar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders logout button when user is authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });
    render(<NavBar />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
