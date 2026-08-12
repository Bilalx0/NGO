import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useCampaigns, useDeleteCampaign } from '../hooks/useCampaigns';
import { CampaignCard } from '../components/CampaignCard';
import { CampaignFilters } from '../components/CampaignFilters';
import type { CampaignFiltersInput } from '../schemas/campaign.schema';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

// ✅ Campaign Types for the filter dropdown
const CAMPAIGN_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'ZAKAT', label: 'Zakat' },
  { value: 'SADQAH', label: 'Sadqah' },
  { value: 'EMERGENCY_RELIEF', label: 'Emergency Relief' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'FOOD_DRIVE', label: 'Food Drive' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function CampaignsListPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<CampaignFiltersInput>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useCampaigns(filters);
  const deleteMutation = useDeleteCampaign();

  const canEdit = user?.role === 'ORG_ADMIN' || user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN';
  const canDelete = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // ✅ Helper to update type filter
  const handleTypeChange = (type: string) => {
    setFilters({
      ...filters,
      type: (type || undefined) as CampaignFiltersInput['type'], 
      page: 1, // Reset to first page when filter changes
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load campaigns</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">Manage your fundraising campaigns</p>
        </div>
        {canEdit && (
          <Link to="/campaigns/new">
            <Button className="bg-primary hover:bg-primary-hover">
              <FiPlus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <CampaignFilters filters={filters} onFilterChange={setFilters} />

      {/* ✅ NEW: Campaign Type Filter (below the main filters) */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Filter by Type:</Label>
        <select
          value={filters.type || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {CAMPAIGN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {filters.type && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTypeChange('')}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear type filter
          </Button>
        )}
      </div>

      {/* Campaigns Grid */}
      {data?.data && data.data.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.total > filters.limit && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {Math.ceil(data.total / filters.limit)}
              </span>
              <Button
                variant="outline"
                disabled={filters.page >= Math.ceil(data.total / filters.limit)}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-border bg-card">
          <p className="text-lg font-medium text-foreground">No campaigns found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {filters.search || filters.status || filters.type
              ? 'Try adjusting your filters'
              : 'Create your first campaign to get started'}
          </p>
          {canEdit && !filters.search && !filters.status && !filters.type && (
            <Link to="/campaigns/new" className="mt-4">
              <Button className="bg-primary hover:bg-primary-hover">
                <FiPlus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ✅ Label component used above (in case it's not imported already)
function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={className} {...props} />;
}