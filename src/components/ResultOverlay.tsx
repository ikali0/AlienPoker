import { cn } from '@/lib/utils';

interface ResultOverlayProps {
  result: 'win' | 'lose' | 'bust' | 'tie' | null;
  payout: number;
  message: string;
}

export function ResultOverlay({ result, payout, message }: ResultOverlayProps) {
  if (!result) return null;

  return (
    <div className={cn(
      'fixed inset-0 pointer-events-none flex items-center justify-center z-50 p-4',
      result === 'bust' && 'animate-bust-flash'
    )}>
      <div className={cn(
        'text-center p-4 sm:p-6 rounded-2xl max-w-sm w-full',
        result === 'win' && 'bg-primary/20 casino-glow-strong',
        result === 'lose' && 'bg-muted/80',
        result === 'bust' && 'bg-destructive/20 bust-glow animate-bust-shake',
        result === 'tie' && 'bg-muted/80'
      )}>
        <h2 className={cn(
          'text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2',
          result === 'win' && 'text-casino-gold',
          result === 'lose' && 'text-muted-foreground',
          result === 'bust' && 'text-destructive',
          result === 'tie' && 'text-foreground'
        )}>
          {result === 'win' && '🎉 WIN!'}
          {result === 'lose' && 'LOSE'}
          {result === 'bust' && '💥 BUST!'}
          {result === 'tie' && 'TIE'}
        </h2>
        
        <p className="text-sm sm:text-lg text-foreground mb-1 sm:mb-2">
          {message}
        </p>
        
        {payout > 0 && (
          <p className="text-xl sm:text-2xl font-bold text-casino-gold">
            +{payout} Credits
          </p>
        )}
      </div>
    </div>
  );
}
