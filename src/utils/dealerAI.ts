import { Card, getRankValue } from './deck';
import { 
  evaluateHand, 
  hasPairOrBetter, 
  has4CardFlushDraw, 
  has4CardStraightDraw 
} from './handEvaluator';

export interface DealerDecision {
  cardsToHold: number[];
  reason: string;
}

export function getDealerDecision(cards: Card[]): DealerDecision {
  const handResult = evaluateHand(cards);

  // Rule 1: Hold any pair or better
  if (hasPairOrBetter(cards)) {
    // Find which cards to hold based on hand type
    switch (handResult.rank) {
      case 'royal-flush':
      case 'straight-flush':
      case 'full-house':
      case 'flush':
      case 'straight':
        return { cardsToHold: [0, 1, 2, 3, 4], reason: `Holding ${handResult.name}` };
      
      case 'four-of-a-kind': {
        const indices = findCardsByRank(cards, handResult.highCards[0]);
        return { cardsToHold: indices, reason: 'Holding Four of a Kind' };
      }
      
      case 'three-of-a-kind': {
        const indices = findCardsByRank(cards, handResult.highCards[0]);
        return { cardsToHold: indices, reason: 'Holding Three of a Kind' };
      }
      
      case 'two-pair': {
        const indices1 = findCardsByRank(cards, handResult.highCards[0]);
        const indices2 = findCardsByRank(cards, handResult.highCards[1]);
        return { cardsToHold: [...indices1, ...indices2], reason: 'Holding Two Pair' };
      }
      
      case 'pair': {
        const indices = findCardsByRank(cards, handResult.highCards[0]);
        return { cardsToHold: indices, reason: 'Holding Pair' };
      }
    }
  }

  // Rule 2: Check for 4-card flush draw
  const flushDraw = has4CardFlushDraw(cards);
  if (flushDraw.hasFlushDraw && flushDraw.cardsToHold) {
    return { cardsToHold: flushDraw.cardsToHold, reason: 'Drawing to Flush' };
  }

  // Rule 3: Check for 4-card straight draw
  const straightDraw = has4CardStraightDraw(cards);
  if (straightDraw.hasStraightDraw && straightDraw.cardsToHold) {
    return { cardsToHold: straightDraw.cardsToHold, reason: 'Drawing to Straight' };
  }

  // Rule 4: Draw up to 3 cards - keep highest cards
  const indexedCards = cards.map((card, index) => ({
    value: getRankValue(card.rank),
    index,
  }));
  indexedCards.sort((a, b) => b.value - a.value);
  
  // Keep the top 2 cards
  const cardsToHold = indexedCards.slice(0, 2).map(c => c.index);
  return { cardsToHold, reason: 'Keeping high cards' };
}

function findCardsByRank(cards: Card[], rankValue: number): number[] {
  return cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => getRankValue(card.rank) === rankValue)
    .map(({ index }) => index);
}
