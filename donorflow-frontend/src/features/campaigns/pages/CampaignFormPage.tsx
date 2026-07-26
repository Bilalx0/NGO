import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// ✅ ADDED status to schema
const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  goalAmount: z.coerce.number().min(1, 'Goal must be at least 1'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bannerImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  presetAmounts: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Closed']).default('Draft'), // ✅ ADDED THIS
});

type CampaignInput = z.infer<typeof campaignSchema>;

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
  });

  // Fetch campaign data if editing
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await api.get(`/campaigns/${id}`);
      return response.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (campaign) {
      reset({
        title: campaign.title,
        description: campaign.description,
        goalAmount: campaign.goalAmount,
        startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
        endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
        bannerImageUrl: campaign.bannerImageUrl || '',
        category: campaign.category || '',
        presetAmounts: campaign.presetAmounts || '',
        status: campaign.status || 'Draft', // ✅ ADDED THIS
      });
    }
  }, [campaign, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CampaignInput) => {
      if (isEditing) {
        await api.patch(`/campaigns/${id}`, data);
      } else {
        await api.post('/campaigns', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(isEditing ? 'Campaign updated successfully!' : 'Campaign created successfully!');
      navigate('/campaigns');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save campaign');
    },
  });

  const onSubmit = async (data: CampaignInput) => {
    await mutation.mutateAsync(data);
  };

  if (isEditing && isLoadingCampaign) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{isEditing ? 'Edit Campaign' : 'Create Campaign'}</h1>
        <p className="mt-1 text-muted-foreground">
          {isEditing ? 'Update your campaign details' : 'Set up a new fundraising campaign'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input id="title" placeholder="e.g., Winter Relief Drive 2026" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Describe your campaign and its impact..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goalAmount">Goal Amount (PKR) *</Label>
                <Input id="goalAmount" type="number" placeholder="500000" {...register('goalAmount')} />
                {errors.goalAmount && <p className="text-xs text-destructive">{errors.goalAmount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g., Emergency, Education, Health" {...register('category')} />
              </div>
            </div>

            {/* ✅ NEW: Status Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="Draft">Draft (Not visible to public)</option>
                <option value="Active">Active (Visible on public donation page)</option>
                <option value="Closed">Closed (No longer accepting donations)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Only "Active" campaigns will be visible to donors on the public donation page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
              <Input id="bannerImageUrl" placeholder="https://example.com/image.jpg" {...register('bannerImageUrl')} />
              {errors.bannerImageUrl && <p className="text-xs text-destructive">{errors.bannerImageUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="presetAmounts">Quick-Select Amounts (Optional)</Label>
              <Input
                id="presetAmounts"
                placeholder="e.g., 500, 1000, 5000, 10000"
                {...register('presetAmounts')}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated amounts. These will appear as quick-select buttons on the public donation page.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-hover"
                disabled={isSubmitting || mutation.isPending}
              >
                {isSubmitting || mutation.isPending ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}