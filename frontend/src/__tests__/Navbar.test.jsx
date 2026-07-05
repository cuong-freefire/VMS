import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import { AuthContext } from '../contexts/authContext.context';

const mockLogout = jest.fn();

const renderNavbar = (authValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <Navbar />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Navbar Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockReset();
  });

  describe('When Authenticated', () => {
    it('should show userName and logout button', () => {
      renderNavbar({
        user: { id: 1, name: 'Test User', email: 'test@vms.com' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        login: jest.fn()
      });

      expect(screen.getByText(/Xin chào Test User/)).toBeInTheDocument();
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('should call logout when button clicked', async () => {
      renderNavbar({
        user: { id: 1, name: 'Test User' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        login: jest.fn()
      });

      fireEvent.click(screen.getByText('Đăng xuất'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable button after click', () => {
      renderNavbar({
        user: { id: 1, name: 'Test User' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        login: jest.fn()
      });

      fireEvent.click(screen.getByText('Đăng xuất'));

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Đang đăng xuất...')).toBeInTheDocument();
    });
  });

  describe('When Not Authenticated', () => {
    it('should show Sign In and Sign Up', () => {
      renderNavbar({
        user: null,
        isAuthenticated: false,
        logout: mockLogout,
        loading: false,
        login: jest.fn()
      });

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
    });
  });

  describe('Offline Resilience (US2)', () => {
    it('should call logout function even when API would fail', async () => {
      const offlineLogout = jest.fn().mockResolvedValue(undefined);

      renderNavbar({
        user: { id: 1, name: 'Test User' },
        isAuthenticated: true,
        logout: offlineLogout,
        loading: false,
        login: jest.fn()
      });

      fireEvent.click(screen.getByText('Đăng xuất'));

      await waitFor(() => {
        expect(offlineLogout).toHaveBeenCalledTimes(1);
      });
    });
  });
});