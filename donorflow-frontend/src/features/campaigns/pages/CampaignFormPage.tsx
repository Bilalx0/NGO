import { useEffect, useState, useRef } from 'react';
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
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { value: 'DONATION', label: 'Donation' },
  { value: 'ZAKAT', label: 'Zakat' },
  { value: 'SADQAH', label: 'Sadqah' },
  { value: 'EMERGENCY_RELIEF', label: 'Emergency Relief' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'FOOD_DRIVE', label: 'Food Drive' },
  { value: 'OTHER', label: 'Other' },
] as const;

const PRESET_AMOUNTS = [200, 500, 1000, 5000, 10000, 25000];

const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  goalAmount: z.coerce.number().min(1, 'Goal must be at least 1'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bannerImageUrl: z.string().optional(),
  category: z.string().optional(),
  presetAmounts: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Closed']).default('Draft'),
  type: z.enum(['DONATION', 'ZAKAT', 'SADQAH', 'EMERGENCY_RELIEF', 'EDUCATION', 'HEALTHCARE', 'FOOD_DRIVE', 'OTHER']).default('DONATION'),
});

type CampaignInput = z.infer<typeof campaignSchema>;

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      type: 'DONATION',
      presetAmounts: '',
      bannerImageUrl: '',
    },
  });

  const presetAmountsValue = watch('presetAmounts') || '';
  const bannerImageUrlValue = watch('bannerImageUrl') || '';

  useEffect(() => {
    if (presetAmountsValue) {
      const parsed = presetAmountsValue
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n));
      setSelectedPresets(parsed);
    }
  }, [presetAmountsValue]);

  useEffect(() => {
    if (bannerImageUrlValue && !bannerPreview) {
      setBannerPreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${bannerImageUrlValue}`);
    }
  }, [bannerImageUrlValue, bannerPreview]);

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
        status: campaign.status || 'Draft',
        type: campaign.type || 'DONATION',
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

  const togglePreset = (amount: number) => {
    let newPresets: number[];
    if (selectedPresets.includes(amount)) {
      newPresets = selectedPresets.filter(p => p !== amount);
    } else {
      newPresets = [...selectedPresets, amount].sort((a, b) => a - b);
    }
    setSelectedPresets(newPresets);
    setValue('presetAmounts', newPresets.join(','));
  };

  const removePreset = (amount: number) => {
    const newPresets = selectedPresets.filter(p => p !== amount);
    setSelectedPresets(newPresets);
    setValue('presetAmounts', newPresets.join(','));
  };

  const addCustomAmount = () => {
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0 && !selectedPresets.includes(amount)) {
      const newPresets = [...selectedPresets, amount].sort((a, b) => a - b);
      setSelectedPresets(newPresets);
      setValue('presetAmounts', newPresets.join(','));
      setCustomAmount('');
    }
  };

  // ✅ Handle banner file selection
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Banner image must be less than 5MB');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.post('/campaigns/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setValue('bannerImageUrl', response.data.bannerUrl);
      toast.success('Banner uploaded successfully!');
    } catch (error: any) {
      toast.error('Failed to upload banner');
      setBannerPreview(null);
      setBannerFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setValue('bannerImageUrl', '');
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
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
                <Label htmlFor="type">Campaign Type *</Label>
                <select
                  id="type"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('type')}
                >
                  {CAMPAIGN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Custom Category</Label>
                <Input id="category" placeholder="e.g., Winter, Ramadan" {...register('category')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goalAmount">Goal Amount (PKR) *</Label>
                <Input id="goalAmount" type="number" placeholder="500000" {...register('goalAmount')} />
                {errors.goalAmount && <p className="text-xs text-destructive">{errors.goalAmount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('status')}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
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

            {/* ✅ NEW: Banner Image Upload */}
            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Campaign Banner Image</Label>
                <p className="text-xs text-muted-foreground">
                  Upload a banner image for your campaign (JPG, PNG, WebP, max 5MB)
                </p>
              </div>

              {bannerPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No banner uploaded</p>
                </div>
              )}

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleBannerChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {bannerPreview ? 'Replace Banner' : 'Upload Banner'}
                  </>
                )}
              </Button>

              <input type="hidden" {...register('bannerImageUrl')} />
            </div>

            {/* Preset Amounts Section */}
            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Quick-Select Donation Amounts</Label>
                <p className="text-xs text-muted-foreground">
                  Click amounts donors can choose from on the public donation page.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((amount) => {
                  const isSelected = selectedPresets.includes(amount);
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => togglePreset(amount)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background border border-border hover:bg-accent hover:border-primary/50'
                        }
                      `}
                    >
                      RS {amount.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              {selectedPresets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-sm">Selected ({selectedPresets.length}):</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPresets.map((amount) => (
                      <span
                        key={amount}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
                        RS {amount.toLocaleString()}
                        <button
                          type="button"
                          onClick={() => removePreset(amount)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAmount();
                    }
                  }}
                  className="flex-1"
                  min="1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomAmount}
                  disabled={!customAmount || isNaN(parseInt(customAmount, 10))}
                >
                  Add Custom
                </Button>
              </div>

              <input type="hidden" {...register('presetAmounts')} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-hover"
                disabled={isSubmitting || mutation.isPending || uploading}
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