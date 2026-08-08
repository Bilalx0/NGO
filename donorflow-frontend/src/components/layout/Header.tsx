import { useState, useEffect } from 'react';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch logo if user belongs to an organization
    if (user?.organizationId) {
      fetchLogo();
    }
  }, [user?.organizationId]);

  const fetchLogo = async () => {
    try {
      const { data } = await api.get('/settings/organization');
      if (data.logoUrl) {
        // Combine API base URL with the relative logo path
        const fullLogoUrl = `${API_URL.replace('/api', '')}${data.logoUrl}`;
        setLogoUrl(fullLogoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch logo', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors, still logout locally
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-3">
        {/* Show logo if exists, otherwise show icon */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Organization Logo"
            className="h-10 w-auto object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FiUser className="h-6 w-6 text-primary" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-slate-900">
          {user?.organizationId ? 'Organization Dashboard' : 'Welcome'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <FiUser className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          <FiLogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}