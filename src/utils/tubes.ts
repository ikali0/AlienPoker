import { HandRank } from './handEvaluator';

export interface TubeState {
  straight: number;
  flush: number;
  fullHouse: number;
  straightFlush: number;
  royalFlush: number;
}

export const INITIAL_TUBES: TubeState = {
  straight: 5,
  flush: 10,
  fullHouse: 15,
  straightFlush: 20,
  royalFlush: 25,
};

export const MAX_TUBES: TubeState = {
  straight: 10,
  flush: 20,
  fullHouse: 30,
  straightFlush: 40,
  royalFlush: 50,
};

export type PayingHandRank = 'straight' | 'flush' | 'full-house' | 'straight-flush' | 'royal-flush';

const handToTubeKey: Record<PayingHandRank, keyof TubeState> = {
  'straight': 'straight',
  'flush': 'flush',
  'full-house': 'fullHouse',
  'straight-flush': 'straightFlush',
  'royal-flush': 'royalFlush',
};

export function isPayingHand(rank: HandRank): rank is PayingHandRank {
  return ['straight', 'flush', 'full-house', 'straight-flush', 'royal-flush'].includes(rank);
}

export function getTubeKey(rank: PayingHandRank): keyof TubeState {
  return handToTubeKey[rank];
}

export function getTubeValue(tubes: TubeState, rank: PayingHandRank): number {
  return tubes[getTubeKey(rank)];
}

export function drainTube(tubes: TubeState, rank: PayingHandRank): { newTubes: TubeState; payout: number } {
  const key = getTubeKey(rank);
  const payout = tubes[key];
  
  return {
    newTubes: {
      ...tubes,
      [key]: 0,
    },
    payout,
  };
}

export function refillTubes(tubes: TubeState): TubeState {
  return {
    straight: Math.min(tubes.straight + 1, MAX_TUBES.straight),
    flush: Math.min(tubes.flush + 1, MAX_TUBES.flush),
    fullHouse: Math.min(tubes.fullHouse + 1, MAX_TUBES.fullHouse),
    straightFlush: Math.min(tubes.straightFlush + 1, MAX_TUBES.straightFlush),
    royalFlush: Math.min(tubes.royalFlush + 1, MAX_TUBES.royalFlush),
  };
}

export function getTubeDisplayName(key: keyof TubeState): string {
  const names: Record<keyof TubeState, string> = {
    straight: 'Straight',
    flush: 'Flush',
    fullHouse: 'Full House',
    straightFlush: 'Str. Flush',
    royalFlush: 'Royal Flush',
  };
  return names[key];
}
