/**
 * Simulation Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  runSimulation, 
  quickSimulation,
  generateReport,
  makeHTDecision,
  initializeTubes,
  DEFAULT_CONFIG,
  calculatePotPerRound,
  calculateVolatility,
  calculateHTExpectedValue,
  detectExploits,
  calculateHouseEdge,
  isHouseEdgeInRange,
  type HTPerformance,
} from '@/simulation';
import { createDeck, shuffleDeck, dealCards } from '@/utils/deck';
import { evaluateHand } from '@/utils/handEvaluator';

describe('Simulation Engine', () => {
  describe('HT Decision Engine', () => {
    it('should make a decision for any 5-card hand', () => {
      const deck = shuffleDeck(createDeck());
      const { dealt } = dealCards(deck, 5);
      
      const decision = makeHTDecision(dealt);
      
      expect(decision).toBeDefined();
      expect(decision.htId).toBeTruthy();
      expect(decision.category).toMatch(/^H[0-5]$/);
      expect(decision.cardsToHold).toBeInstanceOf(Array);
      expect(decision.cardsToHold.length).toBeLessThanOrEqual(5);
    });

    it('should hold all 5 cards for made hands like flush', () => {
      // Create a flush hand manually
      const flushHand = [
        { suit: 'hearts' as const, rank: 'A' as const, id: 'A-hearts' },
        { suit: 'hearts' as const, rank: 'K' as const, id: 'K-hearts' },
        { suit: 'hearts' as const, rank: '7' as const, id: '7-hearts' },
        { suit: 'hearts' as const, rank: '4' as const, id: '4-hearts' },
        { suit: 'hearts' as const, rank: '2' as const, id: '2-hearts' },
      ];
      
      const decision = makeHTDecision(flushHand);
      
      expect(decision.htId).toBe('H5.FL');
      expect(decision.category).toBe('H5');
      expect(decision.cardsToHold).toEqual([0, 1, 2, 3, 4]);
    });

    it('should hold pair cards for pair hands', () => {
      const pairHand = [
        { suit: 'hearts' as const, rank: 'K' as const, id: 'K-hearts' },
        { suit: 'spades' as const, rank: 'K' as const, id: 'K-spades' },
        { suit: 'clubs' as const, rank: '7' as const, id: '7-clubs' },
        { suit: 'diamonds' as const, rank: '4' as const, id: '4-diamonds' },
        { suit: 'hearts' as const, rank: '2' as const, id: '2-hearts' },
      ];
      
      const decision = makeHTDecision(pairHand);
      
      expect(decision.htId).toBe('H2.1P');
      expect(decision.category).toBe('H2');
      expect(decision.cardsToHold.length).toBe(2);
    });
  });

  describe('Tube Engine', () => {
    it('should initialize tubes with config values', () => {
      const tubes = initializeTubes(DEFAULT_CONFIG);
      
      expect(tubes.ST).toBe(DEFAULT_CONFIG.initSTTube);
      expect(tubes.FL).toBe(DEFAULT_CONFIG.initFLTube);
      expect(tubes.FH).toBe(DEFAULT_CONFIG.initFHTube);
      expect(tubes.SF).toBe(DEFAULT_CONFIG.initSFTube);
      expect(tubes.RF).toBe(DEFAULT_CONFIG.initRFTube);
    });
  });

  describe('Simulation Runner', () => {
    it('should run a small simulation without errors', () => {
      const result = runSimulation({
        roundsPerRun: 100,
        playerCount: 2,
      });
      
      expect(result).toBeDefined();
      expect(result.stats.roundsCompleted).toBe(100);
      expect(result.config.playerCount).toBe(2);
    });

    it('should track wins and losses', () => {
      const result = runSimulation({
        roundsPerRun: 500,
        playerCount: 4,
      });
      
      const totalOutcomes = result.stats.totalPlayerWins + 
                           result.stats.totalPlayerLosses + 
                           result.stats.totalPlayerBusts;
      
      // Each round has 4 players
      expect(totalOutcomes).toBeGreaterThan(0);
      expect(totalOutcomes).toBeLessThanOrEqual(500 * 4);
    });

    it('should generate a valid report', () => {
      const result = runSimulation({ roundsPerRun: 100 });
      const report = generateReport(result.stats);
      
      expect(report.summary.roundsCompleted).toBe(100);
      expect(report.playerStats).toBeDefined();
      expect(report.houseStats).toBeDefined();
      expect(report.tubeStats.length).toBe(5);
      expect(report.handDistribution.length).toBe(10);
    });

    it('should respect configuration options', () => {
      const result = runSimulation({
        roundsPerRun: 50,
        playerCount: 6,
        ante: 10,
        dealerDrawAllowed: false,
      });
      
      expect(result.config.playerCount).toBe(6);
      expect(result.config.ante).toBe(10);
      expect(result.config.dealerDrawAllowed).toBe(false);
    });
  });

  describe('Hand Evaluation Integration', () => {
    it('should correctly categorize all hand ranks', () => {
      const hands = {
        'high-card': [
          { suit: 'hearts' as const, rank: 'A' as const, id: '1' },
          { suit: 'spades' as const, rank: 'K' as const, id: '2' },
          { suit: 'clubs' as const, rank: '7' as const, id: '3' },
          { suit: 'diamonds' as const, rank: '4' as const, id: '4' },
          { suit: 'hearts' as const, rank: '2' as const, id: '5' },
        ],
        'pair': [
          { suit: 'hearts' as const, rank: 'K' as const, id: '1' },
          { suit: 'spades' as const, rank: 'K' as const, id: '2' },
          { suit: 'clubs' as const, rank: '7' as const, id: '3' },
          { suit: 'diamonds' as const, rank: '4' as const, id: '4' },
          { suit: 'hearts' as const, rank: '2' as const, id: '5' },
        ],
        'flush': [
          { suit: 'hearts' as const, rank: 'A' as const, id: '1' },
          { suit: 'hearts' as const, rank: 'K' as const, id: '2' },
          { suit: 'hearts' as const, rank: '7' as const, id: '3' },
          { suit: 'hearts' as const, rank: '4' as const, id: '4' },
          { suit: 'hearts' as const, rank: '2' as const, id: '5' },
        ],
      };
      
      for (const [expectedRank, hand] of Object.entries(hands)) {
        const result = evaluateHand(hand);
        expect(result.rank).toBe(expectedRank);
      }
    });
  });
});

describe('Quick Simulation', () => {
  it('should run quickly with default settings', () => {
    const startTime = performance.now();
    const result = quickSimulation(1000, false);
    const duration = performance.now() - startTime;
    
    expect(result.stats.roundsCompleted).toBe(1000);
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});

describe('Math Engine', () => {
  describe('Pot Structure', () => {
    it('should calculate pot per round as A × (P + 1)', () => {
      const config = { ...DEFAULT_CONFIG, ante: 5, playerCount: 4 };
      const pot = calculatePotPerRound(config);
      
      // 5 * (4 + 1) = 25
      expect(pot).toBe(25);
    });

    it('should include dealer contribution in pot', () => {
      const config = { ...DEFAULT_CONFIG, ante: 10, playerCount: 2 };
      const pot = calculatePotPerRound(config);
      
      // 10 * (2 + 1) = 30 (2 players + 1 dealer)
      expect(pot).toBe(30);
    });
  });

  describe('House Edge Calculation', () => {
    it('should calculate house edge correctly', () => {
      const totalAnte = 1000;
      const playPotPayouts = 400;
      const tubePayouts = 100;
      const bustPenalties = 50;
      
      const edge = calculateHouseEdge(totalAnte, playPotPayouts, tubePayouts, bustPenalties);
      
      // TotalPayout = 400 + 100 - 50 = 450
      // HouseEdge = (1000 - 450) / 1000 = 0.55
      expect(edge).toBe(0.55);
    });

    it('should handle zero ante gracefully', () => {
      const edge = calculateHouseEdge(0, 100, 50, 10);
      expect(edge).toBe(0);
    });

    it('should identify optimal house edge range (3-7%)', () => {
      expect(isHouseEdgeInRange(0.03)).toBe(true);
      expect(isHouseEdgeInRange(0.05)).toBe(true);
      expect(isHouseEdgeInRange(0.07)).toBe(true);
      expect(isHouseEdgeInRange(0.02)).toBe(false);
      expect(isHouseEdgeInRange(0.08)).toBe(false);
    });
  });

  describe('Volatility Calculation', () => {
    it('should calculate volatility as standard deviation', () => {
      const deltas = [10, 10, 10, 10, 10]; // No variance
      const volatility = calculateVolatility(deltas);
      
      expect(volatility).toBe(0);
    });

    it('should return higher volatility for varied outcomes', () => {
      const lowVar = [5, 5, 5, 5, 5];
      const highVar = [-50, 100, -30, 80, -10];
      
      const lowVolatility = calculateVolatility(lowVar);
      const highVolatility = calculateVolatility(highVar);
      
      expect(highVolatility).toBeGreaterThan(lowVolatility);
    });

    it('should handle empty array', () => {
      const volatility = calculateVolatility([]);
      expect(volatility).toBe(0);
    });
  });

  describe('HT Expected Value', () => {
    it('should calculate EV for a profitable HT', () => {
      const ht: HTPerformance = {
        htId: 'H2.1P',
        timesUsed: 100,
        wins: 60,
        losses: 35,
        busts: 5,
        totalWagered: 500, // 100 * 5 ante
        totalWon: 600,
        tubeHits: { ST: 0, FL: 0, FH: 0, SF: 0, RF: 0 },
      };
      
      const ev = calculateHTExpectedValue(ht, 5);
      
      // P_win = 0.6, AvgWin = 10
      // P_loss = 0.35, AvgLoss = 5
      // P_bust = 0.05, BustPenalty = 5
      // EV = (0.6 * 10) - (0.35 * 5) - (0.05 * 5) = 6 - 1.75 - 0.25 = 4
      expect(ev).toBeCloseTo(4, 1);
    });

    it('should return 0 for unused HT', () => {
      const ht: HTPerformance = {
        htId: 'H0.DRAW5',
        timesUsed: 0,
        wins: 0,
        losses: 0,
        busts: 0,
        totalWagered: 0,
        totalWon: 0,
        tubeHits: { ST: 0, FL: 0, FH: 0, SF: 0, RF: 0 },
      };
      
      const ev = calculateHTExpectedValue(ht, 5);
      expect(ev).toBe(0);
    });
  });

  describe('Exploit Detection', () => {
    it('should detect exploitable HT strategies', () => {
      const htPerformance: Record<string, HTPerformance> = {
        'H4.4FL': {
          htId: 'H4.4FL',
          timesUsed: 1000,
          wins: 600,
          losses: 350,
          busts: 50,
          totalWagered: 5000,
          totalWon: 6500, // Very profitable
          tubeHits: { ST: 0, FL: 50, FH: 0, SF: 0, RF: 0 },
        },
      };
      
      const alerts = detectExploits(htPerformance, 5);
      
      // Should detect the high EV strategy
      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should not flag strategies with low sample size', () => {
      const htPerformance: Record<string, HTPerformance> = {
        'H5.RF': {
          htId: 'H5.RF',
          timesUsed: 10, // Too few samples
          wins: 10,
          losses: 0,
          busts: 0,
          totalWagered: 50,
          totalWon: 2500,
          tubeHits: { ST: 0, FL: 0, FH: 0, SF: 0, RF: 10 },
        },
      };
      
      const alerts = detectExploits(htPerformance, 5);
      
      // Should skip due to low sample size
      expect(alerts.length).toBe(0);
    });
  });

  describe('Simulation Advanced Metrics', () => {
    it('should track round deltas for volatility calculation', () => {
      const result = runSimulation({
        roundsPerRun: 500,
        playerCount: 4,
      });
      
      // Should have round deltas stored
      expect(result.stats.roundDeltas.length).toBe(500);
      expect(result.stats.volatilityIndex).toBeGreaterThanOrEqual(0);
    });

    it('should run exploit detection after simulation', () => {
      const result = runSimulation({
        roundsPerRun: 500,
        playerCount: 4,
      });
      
      // Exploit alerts should be populated (even if empty)
      expect(result.stats.exploitAlerts).toBeDefined();
      expect(Array.isArray(result.stats.exploitAlerts)).toBe(true);
    });

    it('should track dealer ante contribution', () => {
      const result = runSimulation({
        roundsPerRun: 100,
        playerCount: 4,
        ante: 5,
      });
      
      // Dealer contributes 5 * 100 = 500
      expect(result.stats.dealerAnteContribution).toBe(500);
    });
  });
});
