import { Card, getRankValue, Rank } from './deck';

export type HandRank = 
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card';

export interface HandResult {
  rank: HandRank;
  name: string;
  value: number;
  highCards: number[];
}

const handValues: Record<HandRank, number> = {
  'royal-flush': 10,
  'straight-flush': 9,
  'four-of-a-kind': 8,
  'full-house': 7,
  'flush': 6,
  'straight': 5,
  'three-of-a-kind': 4,
  'two-pair': 3,
  'pair': 2,
  'high-card': 1,
};

const handNames: Record<HandRank, string> = {
  'royal-flush': 'Royal Flush',
  'straight-flush': 'Straight Flush',
  'four-of-a-kind': 'Four of a Kind',
  'full-house': 'Full House',
  'flush': 'Flush',
  'straight': 'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'two-pair': 'Two Pair',
  'pair': 'Pair',
  'high-card': 'High Card',
};

function getRankCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const value = getRankValue(card.rank);
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

function isFlush(cards: Card[]): boolean {
  const suit = cards[0].suit;
  return cards.every(card => card.suit === suit);
}

function getSortedValues(cards: Card[]): number[] {
  return cards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
}

function isStraight(cards: Card[]): boolean {
  const values = getSortedValues(cards);
  
  // Check for A-2-3-4-5 straight (wheel)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return true;
  }
  
  // Check for regular straight
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return false;
    }
  }
  return true;
}

function isRoyalFlush(cards: Card[]): boolean {
  if (!isFlush(cards)) return false;
  const values = getSortedValues(cards);
  return values[0] === 14 && values[1] === 13 && values[2] === 12 && values[3] === 11 && values[4] === 10;
}

export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    throw new Error('Hand must contain exactly 5 cards');
  }

  const rankCounts = getRankCounts(cards);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const values = getSortedValues(cards);
  const flush = isFlush(cards);
  const straight = isStraight(cards);

  // Royal Flush
  if (isRoyalFlush(cards)) {
    return { rank: 'royal-flush', name: handNames['royal-flush'], value: handValues['royal-flush'], highCards: values };
  }

  // Straight Flush
  if (flush && straight) {
    return { rank: 'straight-flush', name: handNames['straight-flush'], value: handValues['straight-flush'], highCards: values };
  }

  // Four of a Kind
  if (counts[0] === 4) {
    const quadValue = Array.from(rankCounts.entries()).find(([, count]) => count === 4)?.[0] || 0;
    return { rank: 'four-of-a-kind', name: handNames['four-of-a-kind'], value: handValues['four-of-a-kind'], highCards: [quadValue, ...values.filter(v => v !== quadValue)] };
  }

  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    const tripValue = Array.from(rankCounts.entries()).find(([, count]) => count === 3)?.[0] || 0;
    const pairValue = Array.from(rankCounts.entries()).find(([, count]) => count === 2)?.[0] || 0;
    return { rank: 'full-house', name: handNames['full-house'], value: handValues['full-house'], highCards: [tripValue, pairValue] };
  }

  // Flush
  if (flush) {
    return { rank: 'flush', name: handNames['flush'], value: handValues['flush'], highCards: values };
  }

  // Straight
  if (straight) {
    // Handle wheel straight (A-2-3-4-5)
    const straightValues = values[0] === 14 && values[4] === 2 ? [5, 4, 3, 2, 1] : values;
    return { rank: 'straight', name: handNames['straight'], value: handValues['straight'], highCards: straightValues };
  }

  // Three of a Kind
  if (counts[0] === 3) {
    const tripValue = Array.from(rankCounts.entries()).find(([, count]) => count === 3)?.[0] || 0;
    return { rank: 'three-of-a-kind', name: handNames['three-of-a-kind'], value: handValues['three-of-a-kind'], highCards: [tripValue, ...values.filter(v => v !== tripValue)] };
  }

  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Array.from(rankCounts.entries())
      .filter(([, count]) => count === 2)
      .map(([value]) => value)
      .sort((a, b) => b - a);
    const kicker = values.find(v => !pairs.includes(v)) || 0;
    return { rank: 'two-pair', name: handNames['two-pair'], value: handValues['two-pair'], highCards: [...pairs, kicker] };
  }

  // Pair
  if (counts[0] === 2) {
    const pairValue = Array.from(rankCounts.entries()).find(([, count]) => count === 2)?.[0] || 0;
    return { rank: 'pair', name: handNames['pair'], value: handValues['pair'], highCards: [pairValue, ...values.filter(v => v !== pairValue)] };
  }

  // High Card
  return { rank: 'high-card', name: handNames['high-card'], value: handValues['high-card'], highCards: values };
}

export function compareHands(hand1: HandResult, hand2: HandResult): number {
  // First compare hand ranks
  if (hand1.value !== hand2.value) {
    return hand1.value - hand2.value;
  }

  // If same rank, compare high cards
  for (let i = 0; i < hand1.highCards.length; i++) {
    if (hand1.highCards[i] !== hand2.highCards[i]) {
      return hand1.highCards[i] - hand2.highCards[i];
    }
  }

  return 0; // Tie
}

export function hasPairOrBetter(cards: Card[]): boolean {
  const result = evaluateHand(cards);
  return result.value >= handValues['pair'];
}

export function has4CardFlushDraw(cards: Card[]): { hasFlushDraw: boolean; suitToKeep?: string; cardsToHold?: number[] } {
  const suitCounts = new Map<string, number[]>();
  
  cards.forEach((card, index) => {
    if (!suitCounts.has(card.suit)) {
      suitCounts.set(card.suit, []);
    }
    suitCounts.get(card.suit)!.push(index);
  });

  for (const [suit, indices] of suitCounts.entries()) {
    if (indices.length === 4) {
      return { hasFlushDraw: true, suitToKeep: suit, cardsToHold: indices };
    }
  }

  return { hasFlushDraw: false };
}

export function has4CardStraightDraw(cards: Card[]): { hasStraightDraw: boolean; cardsToHold?: number[] } {
  const values = cards.map((c, i) => ({ value: getRankValue(c.rank), index: i }));
  values.sort((a, b) => a.value - b.value);

  // Check for 4-card sequences
  for (let start = 0; start <= 1; start++) {
    const subset = values.slice(start, start + 4);
    let isSequence = true;
    
    for (let i = 0; i < 3; i++) {
      if (subset[i + 1].value - subset[i].value !== 1) {
        isSequence = false;
        break;
      }
    }

    if (isSequence) {
      return { hasStraightDraw: true, cardsToHold: subset.map(v => v.index) };
    }
  }

  // Check for A-2-3-4 draw
  const hasAce = values.some(v => v.value === 14);
  const lowCards = values.filter(v => v.value >= 2 && v.value <= 4);
  if (hasAce && lowCards.length >= 3) {
    const aceIndex = values.find(v => v.value === 14)!.index;
    return { hasStraightDraw: true, cardsToHold: [aceIndex, ...lowCards.slice(0, 3).map(v => v.index)] };
  }

  return { hasStraightDraw: false };
}
