import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function CampaignReportsPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['campaign-report'],
    queryFn: async () => {
      const response = await api.get('/reports/campaigns');
      return response.data;
    },
  });

  const handleExport = () => window.open('/api/reports/campaigns/export', '_blank');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reports"><Button variant="ghost"><FiArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaign Reports</h1>
            <p className="mt-1 text-muted-foreground">Track campaign performance</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}><FiDownload className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold text-foreground">{report?.summary.totalCampaigns || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Goal</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(report?.summary.totalGoalAmount || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(report?.summary.totalRaised || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.data.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{c.title}</h3>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs">{c.status}</span>
                    </div>
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(c.progressPercentage, 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(c.currentAmount)} raised</span>
                      <span>{c.progressPercentage.toFixed(1)}% of {formatCurrency(c.goalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}