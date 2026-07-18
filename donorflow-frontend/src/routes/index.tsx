import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PublicRoutes } from './public.routes';
import { ProtectedRoutes } from './protected.routes';

export function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* If authenticated, redirect root to dashboard */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Public routes (auth pages + public campaign pages) */}
        <Route path="/*" element={<PublicRoutes />} />

        {/* Protected routes (dashboard + management pages) */}
        <Route path="/dashboard/*" element={<ProtectedRoutes />} />
        <Route path="/campaigns/*" element={<ProtectedRoutes />} />
        <Route path="/donors/*" element={<ProtectedRoutes />} />
        <Route path="/donations/*" element={<ProtectedRoutes />} />
        <Route path="/reports/*" element={<ProtectedRoutes />} />
        <Route path="/settings/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}