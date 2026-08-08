import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions, useCancelSubscription } from '../hooks/useSubscriptions';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function SubscriptionCancelDialog({
  isOpen,
  campaignName,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  campaignName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Confirm Cancellation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cancel the recurring subscription for <strong>{campaignName}</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();
  const [confirmingSubscriptionId, setConfirmingSubscriptionId] = useState<number | null>(null);
  const [cancellingSubscriptionId, setCancellingSubscriptionId] = useState<number | null>(null);
  const cancelMutation = useCancelSubscription();
  const queryClient = useQueryClient();
  const isCancelling = cancelMutation.status === 'pending';

  const selectedSubscription = data?.find((subscription) => subscription.id === confirmingSubscriptionId);

  const handleCancelClick = (subscriptionId: number) => {
    setConfirmingSubscriptionId(subscriptionId);
  };

  const handleConfirmCancel = () => {
    if (confirmingSubscriptionId === null) {
      return;
    }

    setCancellingSubscriptionId(confirmingSubscriptionId);
    cancelMutation.mutate(confirmingSubscriptionId, {
      onSettled: () => {
        setCancellingSubscriptionId(null);
        setConfirmingSubscriptionId(null);
      },
    });
  };

  const handleCloseDialog = () => {
    setConfirmingSubscriptionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="mt-1 text-muted-foreground">Manage recurring donor subscriptions and cancel them if necessary.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}>
            Refresh
          </Button>
          <Link to="/settings">
            <Button variant="outline">Payment Settings</Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No active subscriptions found. Recurring donations will appear here once they are created.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Interval</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {data.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-muted/50">
                  <td className="px-4 py-4 font-medium text-foreground">{subscription.campaign?.title || 'N/A'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{subscription.donor?.fullName || 'Anonymous'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{formatCurrency(subscription.amount)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{subscription.interval}</td>
                  <td className="px-4 py-4 text-muted-foreground">{subscription.status}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={subscription.status !== 'ACTIVE' || (isCancelling && cancellingSubscriptionId === subscription.id)}
                      onClick={() => handleCancelClick(subscription.id)}
                    >
                      {isCancelling && cancellingSubscriptionId === subscription.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        'Cancel'
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <SubscriptionCancelDialog
        isOpen={confirmingSubscriptionId !== null}
        campaignName={selectedSubscription?.campaign?.title ?? 'this subscription'}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
