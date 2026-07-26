import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useCampaigns, useDeleteCampaign } from '../hooks/useCampaigns';
import { CampaignCard } from '../components/CampaignCard';
import { CampaignFilters } from '../components/CampaignFilters';
import type { CampaignFiltersInput } from '../schemas/campaign.schema';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

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
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : 'Create your first campaign to get started'}
          </p>
          {canEdit && !filters.search && !filters.status && (
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