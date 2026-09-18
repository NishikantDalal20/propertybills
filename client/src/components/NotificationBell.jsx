import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? res.data : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((n) => api.put(`/notifications/${n._id}/read`))
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bill_generated':
        return <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs">📄</span>;
      case 'payment_received':
        return <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs">💰</span>;
      case 'due_reminder':
        return <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs">⏰</span>;
      case 'overdue':
        return <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs">⚠️</span>;
      default:
        return <span className="p-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">🔔</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors focus:outline-none"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden font-sans">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="text-3xl block mb-1">🔔</span>
                <p className="text-xs font-semibold text-gray-600">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Invoice emails, bill generations, and payment updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => !item.read && handleMarkAsRead(item._id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    !item.read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50/70'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!item.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {item.message}
                    </p>
                    <span className="text-[10px] font-medium text-gray-400 mt-1 block">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
