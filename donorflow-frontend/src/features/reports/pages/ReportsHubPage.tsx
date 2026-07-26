import { Link } from 'react-router-dom';
import { FiDollarSign, FiTarget, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportsHubPage() {
  const reports = [
    { title: 'Donation Reports', description: 'View and export donation data with filters', icon: FiDollarSign, path: '/reports/donations' },
    { title: 'Campaign Reports', description: 'Track campaign performance and progress', icon: FiTarget, path: '/reports/campaigns' },
    { title: 'Donor Reports', description: 'Analyze donor behavior and top contributors', icon: FiUsers, path: '/reports/donors' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-muted-foreground">Generate and export comprehensive reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.path} to={report.path}>
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}