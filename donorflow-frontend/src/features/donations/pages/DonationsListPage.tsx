import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useDonations } from '../hooks/useDonations';
import { api } from '@/lib/axios';
import type { DonationFiltersInput } from '../schemas/donation.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export function DonationsListPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<DonationFiltersInput>({ page: 1, limit: 10 });
  const { data, isLoading } = useDonations(filters);

  // ✅ Fetch campaigns for the dropdown
  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const response = await api.get('/campaigns?limit=100');
      return response.data;
    },
  });

  const campaigns = campaignsData?.data || [];
  const canRecord = user?.role === 'ORG_ADMIN' || user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donations</h1>
          <p className="mt-1 text-muted-foreground">Track all donations and generate receipts</p>
        </div>
        {canRecord && (
          <Link to="/donations/new">
            <Button className="bg-primary hover:bg-primary-hover">
              <FiPlus className="mr-2 h-4 w-4" /> Record Donation
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value || undefined, page: 1 })}
          >
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="SAFEPAY">SafePay</option>
          </select>
        </div>

        {/* ✅ NEW: Campaign Filter */}
        <div className="space-y-2">
          <Label>Campaign</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(e) => setFilters({
              ...filters,
              campaignId: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })}
            value={filters.campaignId || ''}
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 10 })} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Receipt #</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Donor</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Method</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((donation) => (
                      <tr key={donation.id} className="transition hover:bg-muted/30">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{donation.receiptNumber}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{donation.donor?.fullName || 'Anonymous'}</td>
                        <td className="px-6 py-4">
                          {donation.campaign?.title ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {donation.campaign.title}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">General</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{donation.paymentMethod || 'N/A'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDate(donation.donatedAt)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-primary">{formatCurrency(donation.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/donations/${donation.id}/receipt`}>
                            <Button variant="ghost" size="sm">View Receipt</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No donations found. Record your first donation to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.total > filters.limit && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {filters.page} of {Math.ceil(data.total / filters.limit)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={filters.page >= Math.ceil(data.total / filters.limit)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}