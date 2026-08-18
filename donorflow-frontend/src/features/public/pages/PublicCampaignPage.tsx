import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path}`;
};

const donationFormSchema = z.object({
  donorName: z.string().min(2, 'Name is required'),
  donorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  donorPhone: z.string().min(10, 'Phone number is required'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  isMonthly: z.boolean().optional(),
  recurringMonths: z.coerce.number().min(1).optional(),
  recurringAmount: z.coerce.number().min(1).optional(),
});

type DonationFormInput = z.infer<typeof donationFormSchema>;

interface Campaign {
  id: number;
  title: string;
  description: string;
  bannerImageUrl?: string;
  goalAmount: number;
  currentAmount: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  presetAmounts?: string;
}

const RECURRING_PRESETS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
];

export function PublicCampaignPage() {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [recurringTouched, setRecurringTouched] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<DonationFormInput>({
    resolver: zodResolver(donationFormSchema) as any,
    defaultValues: {
      paymentMethod: 'EasyPaisa',
      isMonthly: false,
      recurringMonths: 12,
      recurringAmount: 0,
    },
  });

  const isMonthly = watch('isMonthly');
  const mainAmount = watch('amount') || 0;
  const recurringMonths = watch('recurringMonths') || 12;
  const recurringAmount = watch('recurringAmount') || 0;

  // Auto-set recurring amount to main amount when main changes
  // ✅ Auto-sync main amount → recurring amount, UNTIL user edits it manually
  useEffect(() => {
    if (!recurringTouched && mainAmount > 0) {
      setValue('recurringAmount', mainAmount);
    }
  }, [mainAmount, recurringTouched, setValue]);

  // Reset "touched" when the monthly checkbox is toggled
  useEffect(() => {
    setRecurringTouched(false);
  }, [isMonthly]);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await api.get(`/campaigns/public/${slug}`);
        setCampaign(response.data);
      } catch (err: any) {
        setError('Campaign not found or no longer active');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCampaign();
  }, [slug]);

  const onSubmit = async (data: DonationFormInput) => {
    try {
      const payload: any = {
        campaignSlug: slug,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        donorPhone: data.donorPhone,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        isMonthly: data.isMonthly,
      };

      if (data.isMonthly) {
        payload.recurringMonths = data.recurringMonths;
        payload.recurringAmount = data.recurringAmount;
      }

      const response = await api.post('/payments/create-session', payload);

      const checkoutUrl = response.data?.checkoutUrl;
      if (typeof checkoutUrl === 'string' && checkoutUrl.length > 0) {
        window.location.href = checkoutUrl;
        return;
      }

      console.error('Invalid checkoutUrl response:', response.data);
      toast.error('Unable to create payment session. Please try again later.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payment session');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold text-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">Please check the URL or contact the organization.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = campaign.goalAmount > 0 ? (campaign.currentAmount / campaign.goalAmount) * 100 : 0;
  const totalCommitment = isMonthly ? recurringAmount * recurringMonths : mainAmount;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-2 sm:px-6">
          {logoError ? (
            <h1 className="text-xl font-bold text-primary">DonorFlow</h1>
          ) : (
            <img
              src="/donor.png"
              alt="DonorFlow"
              className="h-24 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {campaign.bannerImageUrl && (
              <div className="overflow-hidden rounded-xl shadow-lg">
                <img
                  src={getImageUrl(campaign.bannerImageUrl)}
                  alt={campaign.title}
                  className="h-64 w-full object-cover sm:h-96"
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="space-y-2">
                  {campaign.category && (
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {campaign.category}
                    </span>
                  )}
                  <CardTitle className="text-3xl">{campaign.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(campaign.currentAmount)}</p>
                      <p className="text-sm text-muted-foreground">raised</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(campaign.goalAmount)}</p>
                      <p className="text-sm text-muted-foreground">goal</p>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-center text-sm font-medium text-muted-foreground">
                    {progress.toFixed(1)}% of goal reached
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">About This Campaign</h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {campaign.description}
                  </p>
                </div>

                {(campaign.startDate || campaign.endDate) && (
                  <div className="flex gap-6 border-t border-border pt-4 text-sm">
                    {campaign.startDate && (
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(campaign.startDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {campaign.endDate && (
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(campaign.endDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Make a Donation</CardTitle>
                <p className="text-center text-sm text-muted-foreground">
                  Your contribution makes a difference
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="donorName">Your Name *</Label>
                    <Input
                      id="donorName"
                      placeholder="Enter your full name"
                      {...register('donorName')}
                    />
                    {errors.donorName && <p className="text-xs text-destructive">{errors.donorName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donorEmail">Email (Optional)</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      placeholder="your@email.com"
                      {...register('donorEmail')}
                    />
                    {errors.donorEmail && <p className="text-xs text-destructive">{errors.donorEmail.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donorPhone">Phone Number *</Label>
                    <Input
                      id="donorPhone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      {...register('donorPhone')}
                    />
                    {errors.donorPhone && <p className="text-xs text-destructive">{errors.donorPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR) *</Label>

                    {campaign.presetAmounts && (
                      <div className="mb-2 grid grid-cols-3 gap-2">
                        {campaign.presetAmounts.split(',').map((amt) => {
                          const cleanAmt = amt.trim();
                          if (!cleanAmt) return null;
                          return (
                            <Button
                              key={cleanAmt}
                              type="button"
                              variant="outline"
                              className="w-full text-sm"
                              onClick={() => setValue('amount', Number(cleanAmt))}
                            >
                              PKR {Number(cleanAmt).toLocaleString()}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    <Input
                      id="amount"
                      type="number"
                      placeholder="5000"
                      {...register('amount')}
                    />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <select
                      id="paymentMethod"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      {...register('paymentMethod')}
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash (In Person)</option>
                      <option value="Card">Credit/Debit Card</option>
                    </select>
                    {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
                  </div>

                  {/* Recurring Donation Checkbox */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="isMonthly"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        {...register('isMonthly')}
                      />
                      <Label htmlFor="isMonthly" className="mb-0 text-sm font-medium">
                        <Calendar className="mr-1 inline h-4 w-4" />
                        Make this a recurring monthly donation
                      </Label>
                    </div>

                    {/* Recurring Options (shown when checked) */}
                    {isMonthly && (
                      <div className="space-y-4 pt-3 border-t border-primary/20">
                        {/* Duration Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">How many months?</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {RECURRING_PRESETS.map((preset) => (
                              <Button
                                key={preset.value}
                                type="button"
                                variant={recurringMonths === preset.value ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs"
                                onClick={() => setValue('recurringMonths', preset.value)}
                              >
                                {preset.label}
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Custom months"
                              min="1"
                              {...register('recurringMonths')}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {/* Monthly Amount */}
                        <div className="space-y-2">
                          <Label htmlFor="recurringAmount" className="text-xs font-medium">
                            Monthly Amount (PKR)
                          </Label>
                          <Input
                            id="recurringAmount"
                            type="number"
                            placeholder="5000"
                            {...register('recurringAmount', {
                              onChange: () => setRecurringTouched(true), // ✅ Stop auto-sync once user edits
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Default: Same as one-time amount
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="rounded-lg bg-primary/10 p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monthly:</span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(recurringAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-semibold text-primary">
                              {recurringMonths} {recurringMonths === 1 ? 'month' : 'months'}
                            </span>
                          </div>
                          <div className="border-t border-primary/20 pt-2 flex items-center justify-between">
                            <span className="font-medium">Total Commitment:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(totalCommitment)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : isMonthly ? 'Start Recurring Donation' : 'Donate Now'}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    {isMonthly
                      ? `You'll be charged ${formatCurrency(recurringAmount)} monthly for ${recurringMonths} months`
                      : 'Your donation will be recorded and a receipt will be generated.'}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-white/50 py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <p>Powered by DonorFlow | Secure Donation Platform for Pakistani Nonprofits</p>
        </div>
      </footer>
    </div>
  );
}