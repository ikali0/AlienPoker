import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface HandExample {
  name: string;
  description: string;
  example: string;
  cards: string[];
}

const HAND_RANKINGS: HandExample[] = [
  {
    name: 'Royal Flush',
    description: 'A, K, Q, J, 10 all of the same suit',
    example: 'The best possible hand',
    cards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
  },
  {
    name: 'Straight Flush',
    description: 'Five sequential cards of the same suit',
    example: '5-6-7-8-9 all hearts',
    cards: ['5♥', '6♥', '7♥', '8♥', '9♥'],
  },
  {
    name: 'Four of a Kind',
    description: 'Four cards of the same rank',
    example: 'Four Kings',
    cards: ['K♠', 'K♥', 'K♦', 'K♣', '3♠'],
  },
  {
    name: 'Full House',
    description: 'Three of a kind plus a pair',
    example: 'Three Jacks and two 5s',
    cards: ['J♠', 'J♥', 'J♦', '5♣', '5♠'],
  },
  {
    name: 'Flush',
    description: 'Five cards of the same suit',
    example: 'Any five diamonds',
    cards: ['2♦', '5♦', '8♦', 'J♦', 'A♦'],
  },
  {
    name: 'Straight',
    description: 'Five sequential cards of mixed suits',
    example: '4-5-6-7-8',
    cards: ['4♠', '5♥', '6♦', '7♣', '8♠'],
  },
  {
    name: 'Three of a Kind',
    description: 'Three cards of the same rank',
    example: 'Three Queens',
    cards: ['Q♠', 'Q♥', 'Q♦', '7♣', '2♠'],
  },
  {
    name: 'Two Pair',
    description: 'Two different pairs',
    example: 'Two Aces and two 8s',
    cards: ['A♠', 'A♥', '8♦', '8♣', '4♠'],
  },
  {
    name: 'Pair',
    description: 'Two cards of the same rank',
    example: 'Two 10s',
    cards: ['10♠', '10♥', 'K♦', '7♣', '3♠'],
  },
  {
    name: 'High Card',
    description: 'No matching cards',
    example: 'Highest card wins',
    cards: ['A♠', 'J♥', '8♦', '5♣', '2♠'],
  },
];

function MiniCard({ card }: { card: string }) {
  const isRed = card.includes('♥') || card.includes('♦');
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-10 rounded border border-border bg-card text-xs font-bold ${
        isRed ? 'text-red-500' : 'text-foreground'
      }`}
    >
      {card}
    </span>
  );
}

export function HandRankingsPopup() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border hover:bg-muted"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Hand Rankings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-casino-gold text-xl">
            Poker Hand Rankings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {HAND_RANKINGS.map((hand, index) => (
            <div
              key={hand.name}
              className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground mr-2">
                    #{index + 1}
                  </span>
                  <span className="font-bold text-foreground">{hand.name}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{hand.description}</p>
              <div className="flex gap-1 mt-1">
                {hand.cards.map((card, i) => (
                  <MiniCard key={i} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
