import { Achievement } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface AchievementNotificationProps {
  achievement: Achievement | null;
}

export function AchievementNotification({ achievement }: AchievementNotificationProps) {
  if (!achievement) return null;

  return (
    <div className={cn(
      'fixed top-4 left-1/2 -translate-x-1/2 z-[100]',
      'animate-fade-in'
    )}>
      <div className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-xl',
        'bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20',
        'border-2 border-primary/50',
        'casino-glow-strong',
        'backdrop-blur-sm'
      )}>
        <div className="text-3xl animate-bounce">
          {achievement.icon}
        </div>
        <div>
          <div className="text-xs font-semibold text-casino-gold uppercase tracking-wider">
            Achievement Unlocked!
          </div>
          <div className="font-bold text-foreground">
            {achievement.name}
          </div>
        </div>
      </div>
    </div>
  );
}
