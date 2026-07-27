import { FiDollarSign, FiUsers, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { useDashboardStats } from '@/hooks/useDashboard';
import { StatsCard } from '@/components/shared/StatsCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-primary">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load dashboard stats</p>
      </div>
    );
  }

  // Format dates for the chart to be more readable (e.g., "Jan 15")
  const chartData = stats.donationTrends.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back! Here's what's happening with your campaigns.</p>
      </div>

      {/* 1. Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Raised"
          value={formatCurrency(stats.totalRaised)}
          icon={<FiDollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(stats.monthlyRaised)}
          icon={<FiTrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<FiTarget className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Donors"
          value={stats.totalDonors}
          icon={<FiUsers className="h-6 w-6" />}
        />
      </div>

      {/* 2. Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donation Trends Chart (Takes up 2 columns) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Donation Trends (Last 30 Days)</h2>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `PKR ${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No donation data available for the last 30 days.
              </div>
            )}
          </div>
        </div>

        {/* Top Campaigns Chart (Takes up 1 column) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Top Campaigns</h2>
          <div className="h-[300px] w-full">
            {stats.topCampaigns && stats.topCampaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topCampaigns} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="title" type="category" width={100} tick={{ fontSize: 11, fill: '#0f172a' }} interval={0} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="raised" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.topCampaigns.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#f59e0b' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No campaigns yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Donations */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Donations</h2>
            <Link to="/donations">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentDonations && stats.recentDonations.length > 0 ? (
              stats.recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{donation.donorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {donation.campaignTitle} • {formatDate(donation.donatedAt)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-primary">{formatCurrency(donation.amount)}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">No donations yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/campaigns/new">
              <Button className="w-full justify-start bg-primary hover:bg-primary-hover">
                <FiTarget className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </Link>
            <Link to="/donors/new">
              <Button variant="outline" className="w-full justify-start">
                <FiUsers className="mr-2 h-4 w-4" /> Add Donor
              </Button>
            </Link>
            <Link to="/donations/new">
              <Button variant="outline" className="w-full justify-start">
                <FiDollarSign className="mr-2 h-4 w-4" /> Record Donation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}