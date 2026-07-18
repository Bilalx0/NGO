// Standard paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// Standard API error
export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

// Organization
export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Campaign
export type CampaignStatus = 'Draft' | 'Active' | 'Completed';

export interface Campaign {
  id: number;
  organizationId: number;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  bannerImageUrl?: string;
  status: CampaignStatus;
  goalAmount: number;
  currentAmount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Donor
export interface Donor {
  id: number;
  organizationId: number;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Donation
export interface Donation {
  id: number;
  organizationId: number;
  campaignId?: number;
  donorId?: number;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentReference?: string;
  receiptNumber: string;
  notes?: string;
  donatedAt: string;
  campaign?: Campaign;
  donor?: Donor;
}

// Dashboard Stats
export interface DashboardStats {
  totalRaised: number;
  totalDonors: number;
  activeCampaigns: number;
  monthlyRaised: number;
  recentDonations: Array<{
    id: number;
    amount: number;
    donorName: string;
    campaignTitle: string;
    donatedAt: string;
  }>;
}