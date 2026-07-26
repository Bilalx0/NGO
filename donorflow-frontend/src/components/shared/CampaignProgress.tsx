import { cn, formatCurrency } from '@/lib/utils';

interface CampaignProgressProps {
  title: string;
  currentAmount: number;
  goalAmount: number;
  className?: string;
}

export function CampaignProgress({ title, currentAmount, goalAmount, className }: CampaignProgressProps) {
  const percentage = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(currentAmount)}</span>
        <span>Goal: {formatCurrency(goalAmount)}</span>
      </div>
    </div>
  );
}