import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiDownload, FiUpload } from 'react-icons/fi';
import { useDonors, useDeleteDonor } from '../hooks/useDonors';
import type { DonorFiltersInput } from '../schemas/donor.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { DonorImportModal } from '../components/DonorImportModal';

export function DonorsListPage() {
  const { user } = useAuthStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // CRITICAL: Separate local input state from query filters
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<DonorFiltersInput>({ page: 1, limit: 10 });

  // Debounce the search (500ms delay)
  const debouncedSearch = useDebounce(searchInput, 500);

  // Only update filters when debounced value changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1, // Reset to first page on new search
    }));
  }, [debouncedSearch]);

  const { data, isLoading, isFetching } = useDonors(filters);
  const deleteMutation = useDeleteDonor();

  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to deactivate this donor?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    window.open('/api/donors/export', '_blank');
    toast.success('Downloading donor report...');
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({ page: 1, limit: 10 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donors</h1>
          <p className="mt-1 text-muted-foreground">Manage your donor relationships and history</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <FiDownload className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <FiUpload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            </>
          )}
          <Link to="/donors/new">
            <Button className="bg-primary hover:bg-primary-hover">
              <FiPlus className="mr-2 h-4 w-4" /> Add Donor
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="w-full space-y-2">
          <Label htmlFor="search">Search Donors</Label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, email, or phone..."
              className="pl-9 pr-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
          {isFetching && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Searching...
            </p>
          )}
        </div>
      </div>

      {/* Donors Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {isLoading && !data ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Contact</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Added On</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((donor) => (
                      <tr key={donor.id} className="transition hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <Link to={`/donors/${donor.id}`} className="font-medium text-primary hover:underline">
                            {donor.fullName}
                          </Link>
                          {donor.notes && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{donor.notes}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">{donor.email || '—'}</p>
                          <p className="text-xs text-muted-foreground">{donor.phone || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDate(donor.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/donors/${donor.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(donor.id)}
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        {searchInput
                          ? `No donors found matching "${searchInput}"`
                          : 'No donors yet. Add your first donor to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > filters.limit && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(filters.page - 1) * filters.limit + 1} to{' '}
                  {Math.min(filters.page * filters.limit, data.total)} of {data.total} donors
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page >= Math.ceil(data.total / filters.limit)}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <DonorImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>

  );
}