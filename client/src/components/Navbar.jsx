import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Properties', path: '/properties' },
    { name: 'Tenants', path: '/tenants' },
    { name: 'Meter Readings', path: '/readings' },
    { name: 'Bills', path: '/bills' },
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

  return (
    <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/95 font-sans">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            PropertyBills
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    active
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

        {/* User Profile & Logout / Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            {displayEmail && <span className="text-xs text-gray-500">{displayEmail}</span>}
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all cursor-pointer"
          >
            Logout
          </button>

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

          {navItems.map((item) => {
            const active = isLinkActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'font-semibold bg-blue-50 text-blue-600'
                    : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer mt-2 sm:hidden"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
