/**
 * Stack Draw Simulation Engine - Core Types
 * Deterministic 5-card draw poker simulation with tube-based payouts
 */

import { Card, Rank, Suit } from '@/utils/deck';
import { HandRank, HandResult } from '@/utils/handEvaluator';

// ============================================================================
// Configuration Types
// ============================================================================

export interface SimulationConfig {
  // Game settings
  roundsPerRun: number;
  playerCount: number;
  ante: number;
  
  // Tube initial values
  initSTTube: number;
  initFLTube: number;
  initFHTube: number;
  initSFTube: number;
  initRFTube: number;
  
  // Tube refill settings
  playerRefillsTubesOnTake: boolean;
  houseRefillsOnDecline: boolean;
  tubeRefillAmount: number;
  
  // Dealer rules
  dealerDrawAllowed: boolean;
  dealerBustAllowed: boolean;
  dealerWinsOnSameHT: boolean;
  
  // Bust mechanics
  bustPenaltyMultiplier: number;
  
  // Stack trigger thresholds
  stackTriggerThreshold: number;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  roundsPerRun: 20000,
  playerCount: 4,
  ante: 5,
  
  initSTTube: 5,
  initFLTube: 10,
  initFHTube: 15,
  initSFTube: 20,
  initRFTube: 25,
  
  playerRefillsTubesOnTake: true,
  houseRefillsOnDecline: true,
  tubeRefillAmount: 1,
  
  dealerDrawAllowed: true,
  dealerBustAllowed: true,
  dealerWinsOnSameHT: false,
  
  bustPenaltyMultiplier: 1,
  stackTriggerThreshold: 2,
};

// ============================================================================
// Hold Type (HT) Types
// ============================================================================

export type HTCategory = 
  | 'H5'     // Hold all 5 (made hand)
  | 'H4'     // Hold 4 cards
  | 'H3'     // Hold 3 cards
  | 'H2'     // Hold 2 cards
  | 'H1'     // Hold 1 card
  | 'H0';    // Draw all 5

export interface HTDecision {
  htId: string;
  category: HTCategory;
  description: string;
  cardsToHold: number[];          // Indices of cards to hold
  expectedValue: number;          // Theoretical EV
  bustPotential: boolean;         // Whether this HT can result in bust
}

export interface HTPerformance {
  htId: string;
  timesUsed: number;
  wins: number;
  losses: number;
  busts: number;
  totalWagered: number;
  totalWon: number;
  tubeHits: Record<string, number>;
}

// ============================================================================
// Participant Types
// ============================================================================

export interface Participant {
  id: string;
  isDealer: boolean;
  credits: number;
  currentHand: Card[];
  heldCards: number[];
  finalHand: Card[];
  handResult: HandResult | null;
  htDecision: HTDecision | null;
  isBusted: boolean;
}

export interface ParticipantRoundResult {
  participantId: string;
  initialHand: Card[];
  htDecision: HTDecision | null;
  discardedCards: Card[];
  drawnCards: Card[];
  finalHand: Card[];
  handResult: HandResult;
  outcome: 'win' | 'lose' | 'bust' | 'tie';
  payout: number;
  tubePayout: number;
  bustPenalty: number;
}

// ============================================================================
// Tube Types
// ============================================================================

export type TubeType = 'ST' | 'FL' | 'FH' | 'SF' | 'RF';

export interface TubeBalances {
  ST: number;  // Straight
  FL: number;  // Flush
  FH: number;  // Full House
  SF: number;  // Straight Flush
  RF: number;  // Royal Flush
}

export interface TubeTransaction {
  tubeType: TubeType;
  amount: number;
  reason: 'payout' | 'refill' | 'ante' | 'bust_penalty';
  participantId: string;
}

export interface TubeStats {
  totalFunded: number;
  totalTaken: number;
  hitCount: number;
  avgDepletionRate: number;
}

// ============================================================================
// Round State Types
// ============================================================================

export interface RoundState {
  roundNumber: number;
  deck: Card[];
  participants: Participant[];
  dealer: Participant;
  playPot: number;
  tubeBalances: TubeBalances;
  tubeTransactions: TubeTransaction[];
  phase: 'ante' | 'deal' | 'hold' | 'draw' | 'showdown' | 'payout' | 'complete';
}

export interface RoundResult {
  roundNumber: number;
  participantResults: ParticipantRoundResult[];
  dealerResult: ParticipantRoundResult;
  playPotCollected: number;
  tubePayouts: Record<TubeType, number>;
  bustPenalties: number;
  houseNet: number;
  tubeBalancesAfter: TubeBalances;
  stackTriggers: TubeType[];
}

// ============================================================================
// Round Delta Types (for Volatility Calculation)
// ============================================================================

export interface RoundDelta {
  roundNumber: number;
  totalAnte: number;      // A × (P + 1)
  totalPayout: number;    // playPot + tube - bust
  netDelta: number;       // ante - payout (house perspective)
  playerNetDelta: number; // payout - ante (player perspective)
}

// ============================================================================
// Volatility Metrics
// ============================================================================

export interface VolatilityMetrics {
  roundDeltas: number[];
  mean: number;
  variance: number;
  standardDeviation: number;  // This is the Volatility Index
  riskLevel: 'low' | 'moderate' | 'high';
}

// ============================================================================
// Exploit Detection Types
// ============================================================================

export interface ExploitAlert {
  htId: string;
  calculatedEV: number;
  threshold: number;
  exceededBy: number;
  severity: 'warning' | 'critical';
  recommendation: string;
}

// ============================================================================
// Advanced HT Metrics (extends HTPerformance)
// ============================================================================

export interface AdvancedHTMetrics extends HTPerformance {
  avgWinAmount: number;
  avgLossAmount: number;
  avgBustPenalty: number;
  winProbability: number;    // P_win
  lossProbability: number;   // P_loss
  bustProbability: number;   // P_bust
  calculatedEV: number;      // Full EV formula result
  isExploitable: boolean;
}

// ============================================================================
// Simulation Stats Types
// ============================================================================

export interface SimulationStats {
  // Run info
  roundsCompleted: number;
  totalRounds: number;
  
  // Player stats
  totalPlayerInputs: number;
  totalPlayerWins: number;
  totalPlayerLosses: number;
  totalPlayerBusts: number;
  playerNetCredits: number;
  
  // House stats
  totalHouseInputs: number;
  houseNetProfit: number;
  houseTakePercent: number;
  playerReturnPercent: number;
  
  // Dealer ante tracking
  dealerAnteContribution: number;
  
  // Tube stats
  tubeStats: Record<TubeType, TubeStats>;
  totalTubePayouts: number;
  
  // HT performance
  htPerformance: Record<string, HTPerformance>;
  
  // Hand distribution
  handDistribution: Record<HandRank, number>;
  
  // Bust tracking
  totalBusts: number;
  bustsByReason: Record<string, number>;
  
  // Stack triggers
  stackTriggerCount: number;
  forcedRefills: number;
  
  // Advanced metrics
  roundDeltas: RoundDelta[];
  volatilityIndex: number;
  exploitAlerts: ExploitAlert[];
}

// ============================================================================
// Simulation Result
// ============================================================================

export interface SimulationResult {
  config: SimulationConfig;
  stats: SimulationStats;
  roundResults: RoundResult[];
  finalTubeBalances: TubeBalances;
  executionTimeMs: number;
}

// ============================================================================
// Hand-to-Tube Mapping
// ============================================================================

export const HAND_TO_TUBE: Partial<Record<HandRank, TubeType>> = {
  'straight': 'ST',
  'flush': 'FL',
  'full-house': 'FH',
  'straight-flush': 'SF',
  'royal-flush': 'RF',
};

export function handRankToTubeType(rank: HandRank): TubeType | null {
  return HAND_TO_TUBE[rank] || null;
}

export function tubeTypeToHandRank(tube: TubeType): HandRank {
  const mapping: Record<TubeType, HandRank> = {
    ST: 'straight',
    FL: 'flush',
    FH: 'full-house',
    SF: 'straight-flush',
    RF: 'royal-flush',
  };
  return mapping[tube];
}
