import { Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { Campaign } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CampaignCard({ campaign, onDelete, canEdit, canDelete }: CampaignCardProps) {
  const progress = campaign.goalAmount > 0 
    ? (campaign.currentAmount / campaign.goalAmount) * 100 
    : 0;

  const statusColors = {
    Draft: 'bg-muted text-muted-foreground',
    Active: 'bg-green-100 text-green-700',
    Completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      {/* Banner Image */}
      {campaign.bannerImageUrl && (
        <div className="mb-4 h-48 overflow-hidden rounded-lg bg-muted">
          <img
            src={campaign.bannerImageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusColors[campaign.status])}>
          {campaign.status}
        </span>
        {campaign.category && (
          <span className="text-xs text-muted-foreground">{campaign.category}</span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{campaign.title}</h3>
      {campaign.description && (
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {campaign.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{formatCurrency(campaign.currentAmount)}</span>
          <span className="text-muted-foreground">of {formatCurrency(campaign.goalAmount)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% raised</p>
      </div>

      {/* Dates */}
      {(campaign.startDate || campaign.endDate) && (
        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
          {campaign.startDate && <span>Start: {formatDate(campaign.startDate)}</span>}
          {campaign.endDate && <span>End: {formatDate(campaign.endDate)}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link to={`/campaigns/${campaign.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <FiEye className="mr-2 h-4 w-4" />
            View
          </Button>
        </Link>
        {canEdit && (
          <Link to={`/campaigns/${campaign.id}/edit`}>
            <Button variant="outline" size="sm">
              <FiEdit className="h-4 w-4" />
            </Button>
          </Link>
        )}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this campaign?')) {
                onDelete(campaign.id);
              }
            }}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <FiTrash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}