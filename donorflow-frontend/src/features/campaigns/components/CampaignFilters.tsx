import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiSearch, FiX } from 'react-icons/fi';
import { campaignFiltersSchema, type CampaignFiltersInput } from '../schemas/campaign.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CampaignFiltersProps {
  filters: CampaignFiltersInput;
  onFilterChange: (filters: CampaignFiltersInput) => void;
}

export function CampaignFilters({ filters, onFilterChange }: CampaignFiltersProps) {
  const { register, handleSubmit, reset, watch } = useForm<CampaignFiltersInput>({
    resolver: zodResolver(campaignFiltersSchema) as any,
    defaultValues: filters,
  });

  const status = watch('status');

  const onSubmit = (data: CampaignFiltersInput) => {
    onFilterChange({ ...data, page: 1 });
  };

  const handleClear = () => {
    const cleared = { search: '', status: undefined, page: 1, limit: 10 };
    reset(cleared);
    onFilterChange(cleared);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px] space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search campaigns..."
            className="pl-9"
            {...register('search')}
          />
        </div>
      </div>

      <div className="min-w-[150px] space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...register('status')}
          value={status || ''}
          onChange={(e) => {
            const value = e.target.value as any;
            onFilterChange({ ...filters, status: value || undefined, page: 1 });
          }}
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="outline">
          Apply
        </Button>
        <Button type="button" variant="ghost" onClick={handleClear}>
          <FiX className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </form>
  );
}