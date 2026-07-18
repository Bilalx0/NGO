import { FiLogOut, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/axios';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {user?.organizationId ? 'Organization Dashboard' : 'Welcome'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
            <FiUser className="h-5 w-5 text-brand-700" />
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