import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiMail, FiPhone, FiMapPin, FiFileText } from 'react-icons/fi';
import { useDonor, useDeleteDonor } from '../hooks/useDonors';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export function DonorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: donor, isLoading, error } = useDonor(Number(id));
  const deleteMutation = useDeleteDonor();

  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleDelete = () => {
    if (confirm('Are you sure you want to deactivate this donor?')) {
      deleteMutation.mutate(Number(id), { onSuccess: () => navigate('/donors') });
    }
  };

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (error || !donor) return <div className="flex h-96 items-center justify-center"><p className="text-destructive">Donor not found</p></div>;

  const totalDonated = donor.donations?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/donors">
          <Button variant="ghost"><FiArrowLeft className="mr-2 h-4 w-4" /> Back to Donors</Button>
        </Link>
        <div className="flex gap-2">
          <Link to={`/donors/${id}/edit`}>
            <Button variant="outline"><FiEdit className="mr-2 h-4 w-4" /> Edit</Button>
          </Link>
          {canManage && (
            <Button variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Deactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{donor.fullName}</h2>
              <div className="space-y-3 text-sm">
                {donor.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <FiMail className="h-4 w-4" /> {donor.email}
                  </div>
                )}
                {donor.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <FiPhone className="h-4 w-4" /> {donor.phone}
                  </div>
                )}
                {donor.address && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0" /> {donor.address}
                  </div>
                )}
              </div>
              {donor.notes && (
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <FiFileText className="h-4 w-4" /> Internal Notes
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{donor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Donated</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalDonated)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold text-foreground">{donor.donations?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">First Donation</p>
                  <p className="text-sm font-medium text-foreground">
                    {donor.donations?.length > 0 ? formatDate(donor.donations[donor.donations.length - 1].donatedAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Donation History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Donation History</CardTitle></CardHeader>
            <CardContent>
              {donor.donations && donor.donations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {donor.donations.map((d: any) => (
                        <tr key={d.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(d.donatedAt)}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{d.campaign?.title || 'General'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.paymentMethod || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No donations recorded for this donor yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}