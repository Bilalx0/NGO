import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <h1 className="text-9xl font-bold text-brand-600">404</h1>
      <p className="mt-4 text-2xl text-slate-700">Page not found</p>
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-white transition hover:bg-brand-700"
      >
        <FiHome />
        Go Home
      </Link>
    </div>
  );
}