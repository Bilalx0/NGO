import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { useDonationReceipt } from '../hooks/useDonations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DonationReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { data: donation, isLoading } = useDonationReceipt(Number(id));

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!donation) {
    return <div className="flex h-96 items-center justify-center"><p className="text-destructive">Receipt not found</p></div>;
  }

  const handlePrint = () => window.print();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/donations">
          <Button variant="ghost"><FiArrowLeft className="mr-2 h-4 w-4" /> Back to Donations</Button>
        </Link>
        <Button variant="outline" onClick={handlePrint}>
          <FiPrinter className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Donation Receipt</CardTitle>
          <p className="font-mono text-sm text-muted-foreground">{donation.receiptNumber}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount Donated</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(donation.amount)}</p>
              <p className="text-sm text-muted-foreground">{donation.currency}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Donor Name</p>
                <p className="font-medium text-foreground">{donation.donor?.fullName || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Donor Email</p>
                <p className="font-medium text-foreground">{donation.donor?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaign</p>
                <p className="font-medium text-foreground">{donation.campaign?.title || 'General Fund'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium text-foreground">{donation.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction Reference</p>
                <p className="font-mono text-sm text-foreground">{donation.paymentReference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">{formatDate(donation.donatedAt)}</p>
              </div>
            </div>

            {donation.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">{donation.notes}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>Thank you for your generous donation!</p>
            <p className="mt-1">This receipt serves as proof of your contribution.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}