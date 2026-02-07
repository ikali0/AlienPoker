import { Card } from '@/utils/deck';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface HandProps {
  cards: Card[];
  heldCards: Set<number>;
  isRevealed: boolean;
  onCardClick?: (index: number) => void;
  disabled?: boolean;
  label: string;
  handName?: string;
  isWinner?: boolean;
}

export function Hand({ 
  cards, 
  heldCards, 
  isRevealed, 
  onCardClick, 
  disabled,
  label,
  handName,
  isWinner
}: HandProps) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-3',
      isWinner && 'animate-win-pulse'
    )}>
      <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      
      <div className="flex gap-2 sm:gap-3">
        {cards.map((card, index) => (
          <PlayingCard
            key={card.id}
            card={card}
            isHeld={heldCards.has(index)}
            isRevealed={isRevealed}
            onClick={() => onCardClick?.(index)}
            disabled={disabled}
            dealDelay={index * 100}
          />
        ))}
      </div>

      {handName && (
        <div className={cn(
          'text-lg font-bold mt-2 px-4 py-1 rounded-full',
          isWinner 
            ? 'bg-primary/20 text-casino-gold casino-glow' 
            : 'bg-muted text-muted-foreground'
        )}>
          {handName}
        </div>
      )}
    </div>
  );
}
