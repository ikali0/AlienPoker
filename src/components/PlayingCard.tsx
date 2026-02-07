import { useState, useEffect } from 'react';
import { Card as CardType, getSuitSymbol, getSuitColor } from '@/utils/deck';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: CardType;
  isHeld: boolean;
  isRevealed: boolean;
  onClick?: () => void;
  disabled?: boolean;
  dealDelay?: number;
}

export function PlayingCard({ 
  card, 
  isHeld, 
  isRevealed, 
  onClick, 
  disabled,
  dealDelay = 0 
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(!isRevealed);
  const [isDealt, setIsDealt] = useState(false);

  useEffect(() => {
    const dealTimer = setTimeout(() => {
      setIsDealt(true);
    }, dealDelay);

    return () => clearTimeout(dealTimer);
  }, [dealDelay]);

  useEffect(() => {
    if (isRevealed && isFlipped) {
      const flipTimer = setTimeout(() => {
        setIsFlipped(false);
      }, dealDelay + 100);
      return () => clearTimeout(flipTimer);
    }
  }, [isRevealed, dealDelay]);

  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <div 
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        isDealt ? 'opacity-100' : 'opacity-0 translate-y-4',
        !disabled && 'hover:scale-105'
      )}
      onClick={!disabled ? onClick : undefined}
      style={{ transitionDelay: `${dealDelay}ms` }}
    >
      {/* Hold indicator */}
      {isHeld && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
          <span className="text-xs font-bold text-casino-gold uppercase tracking-wider bg-background/80 px-2 py-0.5 rounded">
            HOLD
          </span>
        </div>
      )}
      
      <div 
        className={cn(
          'perspective-1000 w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36',
          isHeld && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
        )}
      >
        <div 
          className={cn(
            'relative w-full h-full preserve-3d transition-transform duration-500',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Card Front */}
          <div 
            className={cn(
              'absolute inset-0 backface-hidden rounded-lg card-shadow',
              'bg-gradient-to-br from-card to-muted',
              'flex flex-col justify-between p-2',
              'border-2 border-border'
            )}
          >
            <div className={cn(
              'text-lg font-bold',
              suitColor === 'red' ? 'text-casino-red' : 'text-foreground/90'
            )}>
              {card.rank}
              <span className="ml-0.5">{suitSymbol}</span>
            </div>
            
            <div className={cn(
              'text-4xl sm:text-5xl text-center',
              suitColor === 'red' ? 'text-casino-red' : 'text-foreground/90'
            )}>
              {suitSymbol}
            </div>
            
            <div className={cn(
              'text-lg font-bold text-right rotate-180',
              suitColor === 'red' ? 'text-casino-red' : 'text-foreground/90'
            )}>
              {card.rank}
              <span className="ml-0.5">{suitSymbol}</span>
            </div>
          </div>

          {/* Card Back */}
          <div 
            className={cn(
              'absolute inset-0 backface-hidden rounded-lg card-shadow rotate-y-180',
              'bg-gradient-to-br from-casino-blue/80 via-casino-blue/60 to-casino-blue/80',
              'border-2 border-casino-blue/50',
              'flex items-center justify-center'
            )}
          >
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded border-2 border-casino-blue/30 bg-casino-blue/50 flex items-center justify-center">
              <div className="text-casino-blue/50 text-2xl font-bold">♠♥</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
