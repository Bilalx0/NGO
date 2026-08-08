import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiPrinter, FiShare2, FiArrowLeft } from 'react-icons/fi';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DonationReceipt {
  receiptNumber: string;
  amount: number;
  currency: string;
  donorName: string;
  donorEmail?: string;
  donorPhone: string;
  campaignTitle: string;
  paymentMethod: string;
  paymentReference?: string;
  donatedAt: string;
}

export function DonationSuccessPage() {
  const [searchParams] = useSearchParams();
  const receiptNumber = searchParams.get('receipt');
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    setIsCancelled(searchParams.get('cancelled') === 'true');

    const fetchReceipt = async () => {
      if (!receiptNumber) {
        setLoading(false);
        return;
      }

    try {
      // Try the public receipt endpoint first
      const response = await api.get(`/donations/public/receipt/${receiptNumber}`);
      setReceipt(response.data);
    } catch (err: any) {
      console.error('Failed to fetch receipt:', err.response?.status, err.response?.data);
      
      // If that fails, try the regular endpoint (might work if user is logged in)
      try {
        const response = await api.get(`/donations/receipt/${receiptNumber}`);
        setReceipt(response.data);
      } catch (err2: any) {
        console.error('Also failed with regular endpoint:', err2.response?.status);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchReceipt();
}, [receiptNumber]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareText = `I just donated to "${receipt?.campaignTitle}" on DonorFlow! Every contribution counts. Join me in making a difference!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I Made a Donation!',
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold text-foreground">
              {isCancelled ? 'Donation cancelled' : 'Receipt not found'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isCancelled
                ? 'Your payment was cancelled. You may try again or contact the organization.'
                : 'Please check your email or contact the organization.'}
            </p>
            <Link to="/">
              <Button className="mt-4">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 print:bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold text-primary">DonorFlow</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <FiCheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            {isCancelled ? 'Donation Cancelled' : 'Thank You!'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {isCancelled
              ? 'Your payment was cancelled. No donation was recorded.'
              : 'Your donation has been successfully recorded.'}
          </p>
        </div>

        {/* Receipt Card */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Donation Receipt</CardTitle>
            <p className="font-mono text-sm text-muted-foreground">{receipt.receiptNumber}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
              <p className="text-sm text-muted-foreground">Amount Donated</p>
              <p className="text-5xl font-bold text-primary">{formatCurrency(receipt.amount)}</p>
              <p className="text-sm text-muted-foreground">{receipt.currency}</p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Donor Name</p>
                  <p className="font-medium text-foreground">{receipt.donorName}</p>
                </div>
                {receipt.donorEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{receipt.donorEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{receipt.donorPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campaign</p>
                  <p className="font-medium text-foreground">{receipt.campaignTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium text-foreground">{receipt.paymentMethod}</p>
                </div>
                {receipt.paymentReference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm text-foreground">{receipt.paymentReference}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{formatDate(receipt.donatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your generosity makes a real difference. Thank you for supporting this cause!
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This receipt serves as proof of your contribution for tax purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <FiPrinter className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <FiShare2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center print:hidden">
          <Link to="/" className="text-sm text-primary hover:underline">
            <FiArrowLeft className="mr-1 inline h-4 w-4" />
            Return to Homepage
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 py-6 text-center text-sm text-muted-foreground print:hidden">
        <p>Powered by DonorFlow | Secure Donation Platform for Pakistani Nonprofits</p>
      </footer>
    </div>
  );
}