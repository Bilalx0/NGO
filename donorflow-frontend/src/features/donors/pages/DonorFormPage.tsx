import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { donorSchema, type DonorInput } from '../schemas/donor.schema';
import { useDonor, useCreateDonor, useUpdateDonor } from '../hooks/useDonors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DonorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: donor, isLoading: isLoadingDonor } = useDonor(Number(id));
  const createMutation = useCreateDonor();
  const updateMutation = useUpdateDonor(Number(id));

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DonorInput>({
    resolver: zodResolver(donorSchema),
  });

  useEffect(() => {
    if (donor && isEditing) {
      reset({
        fullName: donor.fullName,
        email: donor.email || '',
        phone: donor.phone || '',
        address: donor.address || '',
        notes: donor.notes || '',
      });
    }
  }, [donor, isEditing, reset]);

  const onSubmit = async (data: DonorInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate('/donors');
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  if (isEditing && isLoadingDonor) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{isEditing ? 'Edit Donor' : 'Add New Donor'}</h1>
        <p className="mt-1 text-muted-foreground">{isEditing ? 'Update donor details and notes' : 'Manually add a donor to your database'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Donor Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" placeholder="e.g., Ahmed Raza" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ahmed@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+92 300 1234567" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="City, Area, Street" {...register('address')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                rows={4}
                placeholder="e.g., Prefers WhatsApp updates, interested in education campaigns..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Donor' : 'Add Donor'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/donors')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}