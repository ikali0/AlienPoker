/**
 * Mathematical Engine for Stack Draw Simulation
 * Implements economic formulas: Pot Structure, House Edge, Volatility, HT EV, Exploit Detection
 */

import { SimulationConfig, SimulationStats, HTPerformance, RoundDelta, VolatilityMetrics, ExploitAlert, AdvancedHTMetrics } from './types';

// ============================================================================
// Pot Structure Calculation
// ============================================================================

/**
 * Calculate total pot per round: Pot_round = A × (P + 1)
 * @param config Simulation configuration
 * @returns Total ante collected per round (including dealer)
 */
export function calculatePotPerRound(config: SimulationConfig): number {
  return config.ante * (config.playerCount + 1);
}

/**
 * Calculate total ante for all rounds: TotalAnte = Pot_round × R
 * @param config Simulation configuration
 * @param rounds Number of rounds completed
 */
export function calculateTotalAnte(config: SimulationConfig, rounds: number): number {
  return calculatePotPerRound(config) * rounds;
}

// ============================================================================
// House Edge Calculation
// ============================================================================

/**
 * Calculate House Edge using the formula:
 * HouseEdge = (TotalAnte - TotalPayout) / TotalAnte
 * Where: TotalPayout = PlayPotPayout + TubePayout - BustPenalties
 * 
 * Target: 3% ≤ HouseEdge ≤ 7%
 */
export function calculateHouseEdge(
  totalAnte: number,
  playPotPayouts: number,
  tubePayouts: number,
  bustPenalties: number
): number {
  if (totalAnte === 0) return 0;
  
  const totalPayout = playPotPayouts + tubePayouts - bustPenalties;
  return (totalAnte - totalPayout) / totalAnte;
}

/**
 * Calculate house edge from simulation stats
 */
export function calculateHouseEdgeFromStats(stats: SimulationStats, config: SimulationConfig): number {
  const totalAnte = calculateTotalAnte(config, stats.roundsCompleted);
  const totalPayout = stats.playerNetCredits + stats.totalTubePayouts;
  
  if (totalAnte === 0) return 0;
  return (totalAnte - totalPayout) / totalAnte;
}

/**
 * Check if house edge is within target range (3% - 7%)
 */
export function isHouseEdgeInRange(houseEdge: number): boolean {
  return houseEdge >= 0.03 && houseEdge <= 0.07;
}

/**
 * Get house edge status
 */
export function getHouseEdgeStatus(houseEdge: number): 'low' | 'optimal' | 'high' {
  if (houseEdge < 0.03) return 'low';
  if (houseEdge > 0.07) return 'high';
  return 'optimal';
}

// ============================================================================
// Volatility Index Calculation
// ============================================================================

/**
 * Calculate Volatility Index (σ of round deltas)
 * Volatility = σ(Δ_round)
 * Standard deviation of net round outcomes
 */
export function calculateVolatility(deltas: number[]): number {
  const n = deltas.length;
  if (n === 0) return 0;
  
  const mean = deltas.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = deltas.map(d => Math.pow(d - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  
  return Math.sqrt(variance);
}

/**
 * Calculate full volatility metrics
 */
export function calculateVolatilityMetrics(roundDeltas: RoundDelta[]): VolatilityMetrics {
  const deltas = roundDeltas.map(rd => rd.netDelta);
  const n = deltas.length;
  
  if (n === 0) {
    return {
      roundDeltas: [],
      mean: 0,
      variance: 0,
      standardDeviation: 0,
      riskLevel: 'low',
    };
  }
  
  const mean = deltas.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = deltas.map(d => Math.pow(d - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  // Classify risk level based on standard deviation relative to ante
  let riskLevel: 'low' | 'moderate' | 'high';
  if (standardDeviation < 10) {
    riskLevel = 'low';
  } else if (standardDeviation < 25) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'high';
  }
  
  return {
    roundDeltas: deltas,
    mean,
    variance,
    standardDeviation,
    riskLevel,
  };
}

// ============================================================================
// Hold Type Expected Value Calculation
// ============================================================================

/**
 * Calculate Expected Value for a Hold Type
 * EV_HT = (P_win × AvgWin) - (P_loss × AvgLoss) - (P_bust × BustPenalty)
 */
export function calculateHTExpectedValue(ht: HTPerformance, ante: number): number {
  const total = ht.timesUsed;
  if (total === 0) return 0;
  
  const pWin = ht.wins / total;
  const pLoss = ht.losses / total;
  const pBust = ht.busts / total;
  
  const avgWin = ht.wins > 0 ? ht.totalWon / ht.wins : 0;
  const avgLoss = ante; // Standard loss is ante
  const bustPenalty = ante; // Bust loses ante
  
  return (pWin * avgWin) - (pLoss * avgLoss) - (pBust * bustPenalty);
}

/**
 * Calculate advanced metrics for a Hold Type
 */
export function calculateAdvancedHTMetrics(ht: HTPerformance, ante: number): AdvancedHTMetrics {
  const total = ht.timesUsed;
  
  if (total === 0) {
    return {
      ...ht,
      avgWinAmount: 0,
      avgLossAmount: 0,
      avgBustPenalty: 0,
      winProbability: 0,
      lossProbability: 0,
      bustProbability: 0,
      calculatedEV: 0,
      isExploitable: false,
    };
  }
  
  const avgWinAmount = ht.wins > 0 ? ht.totalWon / ht.wins : 0;
  const avgLossAmount = ante;
  const avgBustPenalty = ante;
  
  const winProbability = ht.wins / total;
  const lossProbability = ht.losses / total;
  const bustProbability = ht.busts / total;
  
  const calculatedEV = calculateHTExpectedValue(ht, ante);
  const exploitThreshold = 0.02 * ante;
  const isExploitable = calculatedEV > exploitThreshold;
  
  return {
    ...ht,
    avgWinAmount,
    avgLossAmount,
    avgBustPenalty,
    winProbability,
    lossProbability,
    bustProbability,
    calculatedEV,
    isExploitable,
  };
}

// ============================================================================
// Exploit Detection
// ============================================================================

/**
 * Detect exploitable Hold Types
 * Trigger when: EV_HT > 0.02 × Ante
 */
export function detectExploits(
  htPerformance: Record<string, HTPerformance>,
  ante: number
): ExploitAlert[] {
  const threshold = 0.02 * ante;
  const alerts: ExploitAlert[] = [];
  
  for (const [htId, perf] of Object.entries(htPerformance)) {
    if (perf.timesUsed < 100) continue; // Need minimum sample size
    
    const ev = calculateHTExpectedValue(perf, ante);
    
    if (ev > threshold) {
      const exceededBy = ev - threshold;
      alerts.push({
        htId,
        calculatedEV: ev,
        threshold,
        exceededBy,
        severity: ev > threshold * 2 ? 'critical' : 'warning',
        recommendation: generateExploitRecommendation(htId, ev, threshold),
      });
    }
  }
  
  return alerts.sort((a, b) => b.calculatedEV - a.calculatedEV);
}

/**
 * Generate recommendation text for exploit alert
 */
function generateExploitRecommendation(htId: string, ev: number, threshold: number): string {
  const severity = ev > threshold * 2 ? 'significantly' : 'slightly';
  
  if (htId.includes('H4')) {
    return `${htId} is ${severity} exploitable. Consider reducing 4-card draw success rates or increasing bust exposure.`;
  }
  if (htId.includes('H3')) {
    return `${htId} is ${severity} exploitable. Consider adjusting 3-card hold logic or tube payout rates.`;
  }
  if (htId.includes('H2')) {
    return `${htId} is ${severity} exploitable. Consider tightening pair/two-pair hold requirements.`;
  }
  
  return `${htId} is ${severity} exploitable (EV: ${ev.toFixed(3)}). Consider adjusting hold logic or payout structure.`;
}

// ============================================================================
// Round Delta Creation
// ============================================================================

/**
 * Create a RoundDelta record from round data
 */
export function createRoundDelta(
  roundNumber: number,
  config: SimulationConfig,
  playPotPayout: number,
  tubePayout: number,
  bustPenalties: number
): RoundDelta {
  const totalAnte = calculatePotPerRound(config);
  const totalPayout = playPotPayout + tubePayout - bustPenalties;
  
  return {
    roundNumber,
    totalAnte,
    totalPayout,
    netDelta: totalAnte - totalPayout, // House perspective (positive = house wins)
    playerNetDelta: totalPayout - totalAnte, // Player perspective (positive = player wins)
  };
}

// ============================================================================
// Economic Analysis Summary
// ============================================================================

export interface EconomicAnalysis {
  houseEdge: number;
  houseEdgePercent: number;
  houseEdgeStatus: 'low' | 'optimal' | 'high';
  isInTargetRange: boolean;
  volatilityIndex: number;
  riskLevel: 'low' | 'moderate' | 'high';
  exploitAlerts: ExploitAlert[];
  exploitCount: number;
  criticalExploits: number;
}

/**
 * Generate comprehensive economic analysis
 */
export function generateEconomicAnalysis(
  stats: SimulationStats,
  config: SimulationConfig
): EconomicAnalysis {
  const houseEdge = calculateHouseEdgeFromStats(stats, config);
  const volatilityMetrics = calculateVolatilityMetrics(stats.roundDeltas);
  const exploitAlerts = detectExploits(stats.htPerformance, config.ante);
  
  return {
    houseEdge,
    houseEdgePercent: houseEdge * 100,
    houseEdgeStatus: getHouseEdgeStatus(houseEdge),
    isInTargetRange: isHouseEdgeInRange(houseEdge),
    volatilityIndex: volatilityMetrics.standardDeviation,
    riskLevel: volatilityMetrics.riskLevel,
    exploitAlerts,
    exploitCount: exploitAlerts.length,
    criticalExploits: exploitAlerts.filter(a => a.severity === 'critical').length,
  };
}
