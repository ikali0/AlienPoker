import { useState, useCallback, useEffect } from 'react';
import { HandRank } from '@/utils/handEvaluator';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'win_streak' | 'specific_hand' | 'total_wins' | 'no_bust';
  target: number | HandRank;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface ChallengesState {
  challenges: Challenge[];
  lastRefresh: string;
}

const DAILY_CHALLENGES_KEY = 'stack-draw-daily-challenges';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function generateDailyChallenges(): Challenge[] {
  const today = getTodayKey();
  // Use date as seed for pseudo-random but consistent daily challenges
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  
  const allChallenges: Omit<Challenge, 'progress' | 'completed' | 'claimed'>[] = [
    {
      id: 'win_streak_3',
      title: 'Hot Streak',
      description: 'Win 3 hands in a row',
      reward: 25,
      type: 'win_streak',
      target: 3,
    },
    {
      id: 'win_streak_5',
      title: 'On Fire',
      description: 'Win 5 hands in a row',
      reward: 50,
      type: 'win_streak',
      target: 5,
    },
    {
      id: 'get_flush',
      title: 'Suited Up',
      description: 'Win with a Flush',
      reward: 20,
      type: 'specific_hand',
      target: 'flush' as HandRank,
    },
    {
      id: 'get_straight',
      title: 'Running Cards',
      description: 'Win with a Straight',
      reward: 15,
      type: 'specific_hand',
      target: 'straight' as HandRank,
    },
    {
      id: 'get_full_house',
      title: 'Full Boat',
      description: 'Win with a Full House',
      reward: 30,
      type: 'specific_hand',
      target: 'full-house' as HandRank,
    },
    {
      id: 'get_three_kind',
      title: 'Triple Threat',
      description: 'Win with Three of a Kind',
      reward: 10,
      type: 'specific_hand',
      target: 'three-of-a-kind' as HandRank,
    },
    {
      id: 'total_wins_5',
      title: 'Consistent Winner',
      description: 'Win 5 hands total',
      reward: 15,
      type: 'total_wins',
      target: 5,
    },
    {
      id: 'total_wins_10',
      title: 'Card Shark',
      description: 'Win 10 hands total',
      reward: 35,
      type: 'total_wins',
      target: 10,
    },
    {
      id: 'no_bust_5',
      title: 'Safe Player',
      description: 'Play 5 hands without busting',
      reward: 20,
      type: 'no_bust',
      target: 5,
    },
  ];

  // Select 3 challenges based on the day
  const shuffled = [...allChallenges].sort((a, b) => {
    const hashA = (seed + a.id.length) % 100;
    const hashB = (seed + b.id.length) % 100;
    return hashA - hashB;
  });

  return shuffled.slice(0, 3).map(c => ({
    ...c,
    progress: 0,
    completed: false,
    claimed: false,
  }));
}

function loadChallenges(): ChallengesState {
  try {
    const stored = localStorage.getItem(DAILY_CHALLENGES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChallengesState;
      // Check if challenges are from today
      if (parsed.lastRefresh === getTodayKey()) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  // Generate new challenges for today
  return {
    challenges: generateDailyChallenges(),
    lastRefresh: getTodayKey(),
  };
}

function saveChallenges(state: ChallengesState): void {
  localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(state));
}

export function useDailyChallenges() {
  const [state, setState] = useState<ChallengesState>(loadChallenges);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [handsWithoutBust, setHandsWithoutBust] = useState(0);

  // Save to localStorage when state changes
  useEffect(() => {
    saveChallenges(state);
  }, [state]);

  // Check for daily reset
  useEffect(() => {
    const checkReset = () => {
      if (state.lastRefresh !== getTodayKey()) {
        setState({
          challenges: generateDailyChallenges(),
          lastRefresh: getTodayKey(),
        });
        setCurrentStreak(0);
        setHandsWithoutBust(0);
      }
    };
    
    // Check on mount and every minute
    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastRefresh]);

  const updateProgress = useCallback((
    type: Challenge['type'],
    value: number,
    isWin: boolean,
    isBust: boolean,
    handRank?: HandRank
  ) => {
    setState(prev => {
      const newChallenges = prev.challenges.map(challenge => {
        if (challenge.completed || challenge.claimed) return challenge;

        let newProgress = challenge.progress;

        switch (challenge.type) {
          case 'win_streak':
            if (type === 'win_streak') {
              newProgress = value;
            }
            break;
          case 'specific_hand':
            if (isWin && handRank === challenge.target) {
              newProgress = 1;
            }
            break;
          case 'total_wins':
            if (isWin) {
              newProgress = challenge.progress + 1;
            }
            break;
          case 'no_bust':
            if (type === 'no_bust') {
              newProgress = value;
            }
            break;
        }

        const targetNum = typeof challenge.target === 'number' ? challenge.target : 1;
        const completed = newProgress >= targetNum;

        return {
          ...challenge,
          progress: Math.min(newProgress, targetNum),
          completed,
        };
      });

      return { ...prev, challenges: newChallenges };
    });
  }, []);

  const recordHandResult = useCallback((
    isWin: boolean,
    isBust: boolean,
    handRank?: HandRank
  ) => {
    // Update streak
    const newStreak = isWin ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);

    // Update hands without bust
    const newHandsWithoutBust = isBust ? 0 : handsWithoutBust + 1;
    setHandsWithoutBust(newHandsWithoutBust);

    // Update challenges
    updateProgress('win_streak', newStreak, isWin, isBust, handRank);
    updateProgress('no_bust', newHandsWithoutBust, isWin, isBust, handRank);
    
    if (isWin && handRank !== undefined) {
      updateProgress('specific_hand', 1, isWin, isBust, handRank);
      updateProgress('total_wins', 1, isWin, isBust, handRank);
    }
  }, [currentStreak, handsWithoutBust, updateProgress]);

  const claimReward = useCallback((challengeId: string): number => {
    let reward = 0;
    
    setState(prev => {
      const newChallenges = prev.challenges.map(challenge => {
        if (challenge.id === challengeId && challenge.completed && !challenge.claimed) {
          reward = challenge.reward;
          return { ...challenge, claimed: true };
        }
        return challenge;
      });

      return { ...prev, challenges: newChallenges };
    });

    return reward;
  }, []);

  const resetChallenges = useCallback(() => {
    setState({
      challenges: generateDailyChallenges(),
      lastRefresh: getTodayKey(),
    });
    setCurrentStreak(0);
    setHandsWithoutBust(0);
  }, []);

  return {
    challenges: state.challenges,
    currentStreak,
    recordHandResult,
    claimReward,
    resetChallenges,
  };
}
