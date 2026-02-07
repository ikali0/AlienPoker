import { cn } from '@/lib/utils';
import { TubeState, MAX_TUBES, getTubeDisplayName } from '@/utils/tubes';

interface TubeGaugeProps {
  tubes: TubeState;
  highlightedTube?: keyof TubeState | null;
  isDraining?: boolean;
}

export function TubeGauge({ tubes, highlightedTube, isDraining }: TubeGaugeProps) {
  const tubeKeys: (keyof TubeState)[] = ['straight', 'flush', 'fullHouse', 'straightFlush', 'royalFlush'];

  return (
    <div className="bg-card/50 rounded-xl p-4 border border-border">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
        Stack Tubes
      </h3>
      
      <div className="flex flex-col gap-3">
        {tubeKeys.map((key) => {
          const value = tubes[key];
          const maxValue = MAX_TUBES[key];
          const percentage = (value / maxValue) * 100;
          const isEmpty = value === 0;
          const isHighlighted = highlightedTube === key;

          return (
            <div 
              key={key}
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                isHighlighted && isDraining && 'animate-tube-drain'
              )}
            >
              <span className={cn(
                'text-xs font-medium w-20 text-right transition-colors',
                isEmpty ? 'text-destructive' : 'text-muted-foreground',
                isHighlighted && 'text-casino-gold'
              )}>
                {getTubeDisplayName(key)}
              </span>
              
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
                <div 
                  className={cn(
                    'h-full transition-all duration-500 rounded-full',
                    isEmpty 
                      ? 'bg-destructive/30' 
                      : 'bg-gradient-to-r from-casino-gold-dim via-casino-gold to-casino-gold-dim',
                    isHighlighted && !isEmpty && 'tube-glow'
                  )}
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Tick marks */}
                <div className="absolute inset-0 flex justify-between px-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-px h-full bg-background/20"
                    />
                  ))}
                </div>
              </div>
              
              <span className={cn(
                'text-xs font-bold w-8 text-left tabular-nums',
                isEmpty ? 'text-destructive' : 'text-foreground',
                isHighlighted && !isEmpty && 'text-casino-gold'
              )}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
