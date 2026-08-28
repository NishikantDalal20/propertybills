import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  return (
    <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800">{user.name || 'Landlord'}</span>
            <span className="text-xs text-gray-500">{user.email || ''}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
