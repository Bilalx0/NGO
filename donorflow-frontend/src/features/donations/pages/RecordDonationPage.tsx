import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { recordDonationSchema, type RecordDonationInput } from '../schemas/donation.schema';
import { useRecordDonation } from '../hooks/useDonations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function RecordDonationPage() {
  const navigate = useNavigate();
  const mutation = useRecordDonation();

  // Fetch donors with error handling
  const { data: donorsData, isLoading: donorsLoading, error: donorsError } = useQuery({
    queryKey: ['donors-list'],
    queryFn: async () => {
      const response = await api.get('/donors?limit=100');
      return response.data.data; // This is the array of donors
    },
  });

  // Fetch campaigns with error handling
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const response = await api.get('/campaigns?limit=100');
      return response.data.data; // This is the array of campaigns
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecordDonationInput>({
    resolver: zodResolver(recordDonationSchema) as any,
    defaultValues: { currency: 'PKR', paymentMethod: 'Cash' },
  });

  const onSubmit = async (data: RecordDonationInput) => {
    try {
      const result = await mutation.mutateAsync(data);
      navigate(`/donations/${result.id}/receipt`);
    } catch (error) {
      // Error is already handled by the mutation's toast
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Record Donation</h1>
        <p className="mt-1 text-muted-foreground">Manually record an offline donation</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Donation Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input id="amount" type="number" placeholder="5000" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Donor Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="donorId">Donor</Label>
                {donorsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading donors...</p>
                ) : donorsError ? (
                  <p className="text-sm text-destructive">Failed to load donors</p>
                ) : (
                  <select 
                    id="donorId" 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    {...register('donorId')}
                  >
                    <option value="">Select Donor (Optional)</option>
                    {donorsData && donorsData.length > 0 ? (
                      donorsData.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.fullName}</option>
                      ))
                    ) : (
                      <option disabled>No donors found. Create one first.</option>
                    )}
                  </select>
                )}
              </div>

              {/* Campaign Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign</Label>
                {campaignsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading campaigns...</p>
                ) : campaignsError ? (
                  <p className="text-sm text-destructive">Failed to load campaigns</p>
                ) : (
                  <select 
                    id="campaignId" 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    {...register('campaignId')}
                  >
                    <option value="">Select Campaign (Optional)</option>
                    {campaignsData && campaignsData.length > 0 ? (
                      campaignsData.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))
                    ) : (
                      <option disabled>No campaigns found. Create one first.</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select 
                  id="paymentMethod" 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                  {...register('paymentMethod')}
                >
                  <option value="Cash">Cash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReference">Transaction Reference</Label>
                <Input id="paymentReference" placeholder="TXN123456" {...register('paymentReference')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea 
                id="notes" 
                rows={3} 
                placeholder="Additional notes..." 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                {...register('notes')} 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? 'Recording...' : 'Record Donation'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/donations')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}