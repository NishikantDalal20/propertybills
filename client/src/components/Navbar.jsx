import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';

export default function Navbar({ isLanding = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const appNavItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Properties', path: '/properties' },
    { name: 'Tenants', path: '/tenants' },
    { name: 'Meter Readings', path: '/readings' },
    { name: 'Bills', path: '/bills' },
    { name: 'Reports', path: '/reports' },
  ];

  const landingNavItems = [
    { name: 'Features', path: '#features' },
    { name: 'How It Works', path: '#how-it-works' },
  ];

  const isLinkActive = (path) => {
    if (path === '/properties') {
      return location.pathname.startsWith('/properties');
    }
    return location.pathname === path;
  };

  const currentUser = user?.user || user || {};
  const displayName = currentUser?.name || 'Landlord';
  const displayEmail = currentUser?.email || '';
  const isLoggedIn = !!user;

  if (isLanding) {
    return (
      <nav className="bg-white/95 border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md font-sans">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Landing Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              PropertyBills
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {landingNavItems.map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button size="sm" className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3 sm:px-4">
                  Dashboard &rarr;
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-block">
                  <Button variant="secondary" size="sm" className="text-xs font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3 sm:px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Landing Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-2">
            {landingNavItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
              >
                {item.name}
              </a>
            ))}

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full text-xs font-semibold bg-blue-600 text-white">
                    Go to Dashboard &rarr;
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full text-xs font-semibold bg-blue-600 text-white">
                      Get Started &rarr;
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/95 font-sans">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            PropertyBills
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {appNavItems.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${active
                      ? 'font-semibold bg-blue-50 text-blue-600'
                      : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Notification Bell, User Profile & Logout / Mobile Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            {displayEmail && <span className="text-xs text-gray-500">{displayEmail}</span>}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:inline-flex text-xs"
          >
            Logout
          </Button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-2">
          <div className="pb-3 border-b border-gray-100 mb-2 sm:hidden">
            <p className="text-sm font-semibold text-gray-800">{displayName}</p>
            {displayEmail && <p className="text-xs text-gray-500">{displayEmail}</p>}
          </div>

          {appNavItems.map((item) => {
            const active = isLinkActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm transition-all ${active
                    ? 'font-semibold bg-blue-50 text-blue-600'
                    : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
              >
                {item.name}
              </Link>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-rose-600 hover:bg-rose-50 sm:hidden"
          >
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
}
