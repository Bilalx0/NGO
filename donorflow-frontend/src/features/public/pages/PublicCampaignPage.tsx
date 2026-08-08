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

const donationFormSchema = z.object({
  donorName: z.string().min(2, 'Name is required'),
  donorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  donorPhone: z.string().min(10, 'Phone number is required'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  isMonthly: z.boolean().optional(),
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
  presetAmounts?: string; // ✅ 1. ADDED THIS LINE
}

export function PublicCampaignPage() {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ 2. ADDED 'setValue' HERE
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<DonationFormInput>({
    resolver: zodResolver(donationFormSchema) as any,
    defaultValues: {
      paymentMethod: 'EasyPaisa',
      isMonthly: false,
    },
  });

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
      const response = await api.post('/payments/create-session', {
        campaignSlug: slug,
        ...data,
      });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="text-xl font-bold text-primary">DonorFlow</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            {campaign.bannerImageUrl && (
              <div className="overflow-hidden rounded-xl shadow-lg">
                <img
                  src={campaign.bannerImageUrl}
                  alt={campaign.title}
                  className="h-64 w-full object-cover sm:h-96"
                />
              </div>
            )}

            {/* Campaign Details */}
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
                {/* Progress Bar */}
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

                {/* Description */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">About This Campaign</h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {campaign.description}
                  </p>
                </div>

                {/* Dates */}
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

          {/* Right: Donation Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-xl">
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

                  {/* ✅ 3. ADDED QUICK-SELECT BUTTONS HERE */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR) *</Label>
                    
                    {campaign.presetAmounts && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
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

                  <div className="flex items-center gap-2">
                    <input
                      id="isMonthly"
                      type="checkbox"
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      {...register('isMonthly')}
                    />
                    <Label htmlFor="isMonthly" className="mb-0 text-sm">
                      Make this a recurring monthly donation
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Donate Now'}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Your donation will be recorded and a receipt will be generated.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 py-6 text-center text-sm text-muted-foreground">
        <p>Powered by DonorFlow | Secure Donation Platform for Pakistani Nonprofits</p>
      </footer>
    </div>
  );
}