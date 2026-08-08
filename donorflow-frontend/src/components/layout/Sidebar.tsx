import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiUserPlus
} from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FiHome },
  { label: 'Campaigns', path: '/campaigns', icon: FiHome },
  { label: 'Donors', path: '/donors', icon: FiUsers },
  { label: 'Donations', path: '/donations', icon: FiDollarSign },
  { label: 'Subscriptions', path: '/subscriptions', icon: FiBarChart2 },
  { label: 'Reports', path: '/reports', icon: FiBarChart2 },
  { label: 'Settings', path: '/settings', icon: FiSettings },
  { label: 'Team Members', path: '/users', icon: FiUserPlus },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6 pb-10 pt-12">
        <img
          src="/donor.png"
          alt="DonorFlow logo"
          className="object-contain"
        />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}