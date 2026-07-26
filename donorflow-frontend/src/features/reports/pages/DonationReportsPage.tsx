import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function DonationReportsPage() {
  // ✅ 1. Added campaignId to filters state
  const [filters, setFilters] = useState({ 
    startDate: '', 
    endDate: '', 
    campaignId: '' 
  });

  // ✅ 2. Fetch campaigns for the dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-for-filter'],
    queryFn: async () => {
      const res = await api.get('/campaigns?limit=100');
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    },
  });

  // ✅ 3. Updated query to include campaignId
  const { data: report, isLoading } = useQuery({
    queryKey: ['donation-report', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.campaignId) params.append('campaignId', filters.campaignId);
      
      const response = await api.get(`/reports/donations?${params.toString()}`);
      return response.data;
    },
  });

  // ✅ 4. Updated export to include campaignId
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.campaignId) params.append('campaignId', filters.campaignId);
    
    window.open(`/api/reports/donations/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="ghost"><FiArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donation Reports</h1>
            <p className="mt-1 text-muted-foreground">Filter and export donation data</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FiDownload className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          {/* ✅ 5. Changed to sm:grid-cols-3 to fit the new dropdown */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
              />
            </div>
            
            {/* ✅ 6. NEW: Campaign Filter Dropdown */}
            <div className="space-y-2">
              <Label>Campaign</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={filters.campaignId}
                onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })}
              >
                <option value="">All Campaigns</option>
                {campaigns?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Donations</p>
                <p className="text-2xl font-bold text-foreground">{report?.summary.totalDonations || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(report?.summary.totalAmount || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Average Donation</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(report?.summary.averageDonation || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Donations</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donor</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report?.data && report.data.length > 0 ? (
                      report.data.map((d: any) => (
                        <tr key={d.id} className="hover:bg-muted/30 transition">
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(d.donatedAt)}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{d.donorName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.campaignTitle}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.paymentMethod || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No donations found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}