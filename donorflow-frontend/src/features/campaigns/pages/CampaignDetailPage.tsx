import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiArrowLeft, FiCopy, FiDownload } from 'react-icons/fi';
import { useCampaign, useDeleteCampaign } from '../hooks/useCampaigns';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useState } from 'react';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: campaign, isLoading, error } = useCampaign(Number(id));
  const deleteMutation = useDeleteCampaign();
  const [, setQrCodeUrl] = useState<string | null>(null);

  const canEdit = user?.role === 'ORG_ADMIN' || user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN';
  const canDelete = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => navigate('/campaigns'),
      });
    }
  };

  const handleCopyPublicUrl = () => {
    if (campaign) {
      const url = `${window.location.origin}/campaign/${campaign.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('Public URL copied to clipboard!');
    }
  };

  const handleDownloadQR = async () => {
    if (campaign) {
      try {
        const response = await fetch(`/api/campaigns/${id}/qrcode`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${campaign.slug}-qrcode.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('QR code downloaded!');
      } catch (error) {
        toast.error('Failed to download QR code');
      }
    }
  };

  // ✅ Helper to build full image URL
  const getImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Campaign not found</p>
      </div>
    );
  }

  const progress = campaign.goalAmount > 0
    ? (campaign.currentAmount / campaign.goalAmount) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/campaigns">
        <Button variant="ghost">
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{campaign.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{campaign.status}</span>
            {campaign.category && <span>{campaign.category}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/campaigns/${id}/edit`}>
              <Button variant="outline">
                <FiEdit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Banner Image */}
      {/* Banner Image */}
      {campaign.bannerImageUrl && (
        <div className="h-64 overflow-hidden rounded-xl bg-muted">
          <img
            src={getImageUrl(campaign.bannerImageUrl)}
            alt={campaign.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              console.error('Banner failed to load:', campaign.bannerImageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground">
                {campaign.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Dates */}
          {(campaign.startDate || campaign.endDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {campaign.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium text-foreground">{formatDate(campaign.startDate)}</p>
                    </div>
                  )}
                  {campaign.endDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium text-foreground">{formatDate(campaign.endDate)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Progress & Actions */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(campaign.currentAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  raised of {formatCurrency(campaign.goalAmount)} goal
                </p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-center text-sm font-medium text-foreground">
                {progress.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          {/* Public URL & QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>Share Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Public URL</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/campaign/${campaign.slug}`}
                    className="flex-1 text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyPublicUrl}>
                    <FiCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">QR Code</p>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-border bg-white p-4">
                    <img
                      src={`/api/campaigns/${id}/qrcode`}
                      alt="Campaign QR Code"
                      className="h-full w-full"
                      onError={() => setQrCodeUrl(null)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                    <FiDownload className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}