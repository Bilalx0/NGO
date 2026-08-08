import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { CampaignsListPage } from '@/features/campaigns/pages/CampaignsListPage';
import { CampaignFormPage } from '@/features/campaigns/pages/CampaignFormPage';
import { CampaignDetailPage } from '@/features/campaigns/pages/CampaignDetailPage';
import { DonorsListPage } from '@/features/donors/pages/DonorsListPage';
import { DonorFormPage } from '@/features/donors/pages/DonorFormPage';
import { DonorDetailPage } from '@/features/donors/pages/DonorDetailPage';
import { DonationsListPage } from '@/features/donations/pages/DonationsListPage';
import { RecordDonationPage } from '@/features/donations/pages/RecordDonationPage';
import { DonationReceiptPage } from '@/features/donations/pages/DonationReceiptPage';
import { ReportsHubPage } from '@/features/reports/pages/ReportsHubPage';
import { DonationReportsPage } from '@/features/reports/pages/DonationReportsPage';
import { CampaignReportsPage } from '@/features/reports/pages/CampaignReportsPage';
import { DonorReportsPage } from '@/features/reports/pages/DonorReportsPage';
import { PublicCampaignPage } from '@/features/public/pages/PublicCampaignPage';
import { DonationSuccessPage } from '@/features/public/pages/DonationSuccessPage';
import SettingsPage from '@/features/settings/pages/Settings';
import { SubscriptionsPage } from '@/features/payments/pages/SubscriptionsPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { UserFormPage } from '@/features/users/pages/UserFormPage';;
import { PublicHomePage } from '@/features/public/pages/PublicHomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';


export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/home" element={<PublicHomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/set-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Campaign Routes */}
          <Route path="/campaigns" element={<CampaignsListPage />} />
          <Route path="/campaigns/new" element={<CampaignFormPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/campaigns/:id/edit" element={<CampaignFormPage />} />

          {/* Donor Routes */}
          <Route path="/donors" element={<DonorsListPage />} />
          <Route path="/donors/new" element={<DonorFormPage />} />
          <Route path="/donors/:id" element={<DonorDetailPage />} />
          <Route path="/donors/:id/edit" element={<DonorFormPage />} />

          {/* Donation Routes */}
          <Route path="/donations" element={<DonationsListPage />} />
          <Route path="/donations/new" element={<RecordDonationPage />} />
          <Route path="/donations/:id/receipt" element={<DonationReceiptPage />} />

          {/* Report Routes */}
          <Route path="/reports" element={<ReportsHubPage />} />
          <Route path="/reports/donations" element={<DonationReportsPage />} />
          <Route path="/reports/campaigns" element={<CampaignReportsPage />} />
          <Route path="/reports/donors" element={<DonorReportsPage />} />

          {/* Public Routes */}
          <Route path="/campaign/:slug" element={<PublicCampaignPage />} />
          <Route path="/donate/success" element={<DonationSuccessPage />} />

          {/* User Routes */}
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}