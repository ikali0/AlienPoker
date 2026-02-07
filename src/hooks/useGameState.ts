import { useState, useCallback } from 'react';
import { Card, createDeck, shuffleDeck, dealCards } from '@/utils/deck';
import { evaluateHand, compareHands, HandResult } from '@/utils/handEvaluator';
import { getDealerDecision } from '@/utils/dealerAI';
import { 
  TubeState, 
  INITIAL_TUBES, 
  isPayingHand, 
  getTubeValue, 
  drainTube, 
  refillTubes,
  getTubeKey,
  PayingHandRank
} from '@/utils/tubes';

export type GamePhase = 'betting' | 'holding' | 'showdown' | 'result';
export type GameResult = 'win' | 'lose' | 'bust' | 'tie' | null;

interface GameStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  busts: number;
  totalWagered: number;
  totalWon: number;
}

interface GameState {
  phase: GamePhase;
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  playerHeldCards: Set<number>;
  dealerHeldCards: Set<number>;
  playerHandResult: HandResult | null;
  dealerHandResult: HandResult | null;
  credits: number;
  tubes: TubeState;
  stats: GameStats;
  result: GameResult;
  resultMessage: string;
  payout: number;
  highlightedTube: keyof TubeState | null;
}

const ANTE = 5;
const STARTING_CREDITS = 100;

const initialStats: GameStats = {
  handsPlayed: 0,
  wins: 0,
  losses: 0,
  busts: 0,
  totalWagered: 0,
  totalWon: 0,
};

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: 'betting',
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerHeldCards: new Set(),
    dealerHeldCards: new Set(),
    playerHandResult: null,
    dealerHandResult: null,
    credits: STARTING_CREDITS,
    tubes: INITIAL_TUBES,
    stats: initialStats,
    result: null,
    resultMessage: '',
    payout: 0,
    highlightedTube: null,
  });

  const deal = useCallback(() => {
    if (state.credits < ANTE) return;

    const freshDeck = shuffleDeck(createDeck());
    const { dealt: playerCards, remaining: afterPlayer } = dealCards(freshDeck, 5);
    const { dealt: dealerCards, remaining: finalDeck } = dealCards(afterPlayer, 5);

    setState(prev => ({
      ...prev,
      phase: 'holding',
      deck: finalDeck,
      playerHand: playerCards,
      dealerHand: dealerCards,
      playerHeldCards: new Set(),
      dealerHeldCards: new Set(),
      playerHandResult: null,
      dealerHandResult: null,
      credits: prev.credits - ANTE,
      result: null,
      resultMessage: '',
      payout: 0,
      highlightedTube: null,
      stats: {
        ...prev.stats,
        handsPlayed: prev.stats.handsPlayed + 1,
        totalWagered: prev.stats.totalWagered + ANTE,
      },
    }));
  }, [state.credits]);

  const toggleHold = useCallback((index: number) => {
    if (state.phase !== 'holding') return;

    setState(prev => {
      const newHeld = new Set(prev.playerHeldCards);
      if (newHeld.has(index)) {
        newHeld.delete(index);
      } else {
        newHeld.add(index);
      }
      return { ...prev, playerHeldCards: newHeld };
    });
  }, [state.phase]);

  const draw = useCallback(() => {
    if (state.phase !== 'holding') return;

    let currentDeck = [...state.deck];
    
    // Player draws
    const newPlayerHand = state.playerHand.map((card, index) => {
      if (state.playerHeldCards.has(index)) return card;
      const [newCard, ...rest] = currentDeck;
      currentDeck = rest;
      return newCard;
    });

    // Dealer AI decision
    const dealerDecision = getDealerDecision(state.dealerHand);
    const dealerHeld = new Set(dealerDecision.cardsToHold);
    
    // Dealer draws
    const newDealerHand = state.dealerHand.map((card, index) => {
      if (dealerHeld.has(index)) return card;
      const [newCard, ...rest] = currentDeck;
      currentDeck = rest;
      return newCard;
    });

    // Evaluate hands
    const playerResult = evaluateHand(newPlayerHand);
    const dealerResult = evaluateHand(newDealerHand);
    const comparison = compareHands(playerResult, dealerResult);

    setState(prev => ({
      ...prev,
      phase: 'showdown',
      deck: currentDeck,
      playerHand: newPlayerHand,
      dealerHand: newDealerHand,
      dealerHeldCards: dealerHeld,
      playerHandResult: playerResult,
      dealerHandResult: dealerResult,
    }));

    // Delay the result reveal
    setTimeout(() => {
      resolveGame(playerResult, dealerResult, comparison);
    }, 1500);
  }, [state]);

  const resolveGame = useCallback((
    playerResult: HandResult, 
    dealerResult: HandResult, 
    comparison: number
  ) => {
    setState(prev => {
      let newCredits = prev.credits;
      let newTubes = prev.tubes;
      let result: GameResult;
      let resultMessage = '';
      let payout = 0;
      let highlightedTube: keyof TubeState | null = null;
      let newStats = { ...prev.stats };

      if (comparison > 0) {
        // Player wins
        if (isPayingHand(playerResult.rank)) {
          const tubeKey = getTubeKey(playerResult.rank as PayingHandRank);
          const tubeValue = getTubeValue(prev.tubes, playerResult.rank as PayingHandRank);
          highlightedTube = tubeKey;

          if (tubeValue > 0) {
            const drainResult = drainTube(prev.tubes, playerResult.rank as PayingHandRank);
            newTubes = drainResult.newTubes;
            payout = drainResult.payout;
            newCredits += payout;
            result = 'win';
            resultMessage = `${playerResult.name} beats ${dealerResult.name}!`;
            newStats.wins++;
            newStats.totalWon += payout;
          } else {
            // Tube is empty - BUST!
            result = 'bust';
            resultMessage = `${playerResult.name} tube is empty! No payout.`;
            newStats.busts++;
          }
        } else {
          // Won with non-tube hand
          result = 'win';
          resultMessage = `${playerResult.name} beats ${dealerResult.name}!`;
          payout = ANTE; // Return ante for lower winning hands
          newCredits += payout;
          newStats.wins++;
          newStats.totalWon += payout;
        }
      } else if (comparison < 0) {
        // Dealer wins
        result = 'lose';
        resultMessage = `${dealerResult.name} beats your ${playerResult.name}`;
        newStats.losses++;
      } else {
        // Tie
        result = 'tie';
        resultMessage = 'Push! Both hands tie.';
        payout = ANTE;
        newCredits += payout; // Return ante on tie
        newStats.totalWon += payout;
      }

      // Refill tubes at end of round
      newTubes = refillTubes(newTubes);

      return {
        ...prev,
        phase: 'result',
        credits: newCredits,
        tubes: newTubes,
        stats: newStats,
        result,
        resultMessage,
        payout,
        highlightedTube,
      };
    });
  }, []);

  const newHand = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'betting',
      playerHand: [],
      dealerHand: [],
      playerHeldCards: new Set(),
      dealerHeldCards: new Set(),
      playerHandResult: null,
      dealerHandResult: null,
      result: null,
      resultMessage: '',
      payout: 0,
      highlightedTube: null,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState({
      phase: 'betting',
      deck: [],
      playerHand: [],
      dealerHand: [],
      playerHeldCards: new Set(),
      dealerHeldCards: new Set(),
      playerHandResult: null,
      dealerHandResult: null,
      credits: STARTING_CREDITS,
      tubes: INITIAL_TUBES,
      stats: initialStats,
      result: null,
      resultMessage: '',
      payout: 0,
      highlightedTube: null,
    });
  }, []);

  return {
    ...state,
    ante: ANTE,
    canAffordAnte: state.credits >= ANTE,
    deal,
    toggleHold,
    draw,
    newHand,
    resetGame,
  };
}
