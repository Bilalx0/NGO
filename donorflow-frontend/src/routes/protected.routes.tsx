import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

export function ProtectedRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Future routes will be added here */}
        <Route path="/campaigns" element={<div>Campaigns (Coming Soon)</div>} />
        <Route path="/donors" element={<div>Donors (Coming Soon)</div>} />
        <Route path="/donations" element={<div>Donations (Coming Soon)</div>} />
        <Route path="/reports" element={<div>Reports (Coming Soon)</div>} />
        <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
      </Route>
    </Routes>
  );
}