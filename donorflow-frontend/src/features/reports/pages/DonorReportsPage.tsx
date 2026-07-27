import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function DonorReportsPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['donor-report'],
    queryFn: async () => {
      const response = await api.get('/reports/donors?topDonorsLimit=20');
      return response.data;
    },
  });

  const handleExport = () => window.open('/api/reports/donors/export', '_blank');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reports"><Button variant="ghost"><FiArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donor Reports</h1>
            <p className="mt-1 text-muted-foreground">Top donors and contribution analysis</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}><FiDownload className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold text-foreground">{report?.summary.totalDonors || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Top Donor Contribution</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(report?.summary.topDonorTotal || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Top Donors</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donations</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report?.data.map((d: any, index: number) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{d.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.email || 'N/A'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.donationCount}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(d.totalDonated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}