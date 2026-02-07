import { useState, useCallback, useEffect } from 'react';
import type { HandRank } from '@/utils/handEvaluator';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface AchievementProgress {
  totalWins: number;
  totalHands: number;
  royalFlushes: number;
  straightFlushes: number;
  fullHouses: number;
  flushes: number;
  straights: number;
  threeOfAKind: number;
  winStreak: number;
  maxWinStreak: number;
  busts: number;
}

const ACHIEVEMENTS_STORAGE_KEY = 'stack-draw-achievements';
const PROGRESS_STORAGE_KEY = 'stack-draw-achievement-progress';

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Hand-based achievements
  { id: 'first_win', name: 'First Victory', description: 'Win your first hand', icon: '🏆' },
  { id: 'royal_flush', name: 'Royal Treatment', description: 'Get a Royal Flush', icon: '👑' },
  { id: 'straight_flush', name: 'Straight Fire', description: 'Get a Straight Flush', icon: '🔥' },
  { id: 'full_house', name: 'Full House', description: 'Get a Full House', icon: '🏠' },
  { id: 'flush_master', name: 'Flush Master', description: 'Get a Flush', icon: '💎' },
  { id: 'straight_shooter', name: 'Straight Shooter', description: 'Get a Straight', icon: '➡️' },
  
  // Milestone achievements
  { id: 'win_10', name: 'Getting Started', description: 'Win 10 hands', icon: '⭐', progress: 0, target: 10 },
  { id: 'win_50', name: 'Card Shark', description: 'Win 50 hands', icon: '🦈', progress: 0, target: 50 },
  { id: 'win_100', name: 'High Roller', description: 'Win 100 hands', icon: '💰', progress: 0, target: 100 },
  { id: 'hands_100', name: 'Century Club', description: 'Play 100 hands', icon: '💯', progress: 0, target: 100 },
  
  // Streak achievements
  { id: 'streak_3', name: 'Hot Hand', description: 'Win 3 hands in a row', icon: '🔥', progress: 0, target: 3 },
  { id: 'streak_5', name: 'On Fire', description: 'Win 5 hands in a row', icon: '🌟', progress: 0, target: 5 },
  { id: 'streak_10', name: 'Unstoppable', description: 'Win 10 hands in a row', icon: '⚡', progress: 0, target: 10 },
  
  // Special achievements
  { id: 'survivor', name: 'Survivor', description: 'Recover after going bust 3 times', icon: '🛡️', progress: 0, target: 3 },
  { id: 'lucky_7', name: 'Lucky Seven', description: 'Win with exactly 7 credits remaining', icon: '🍀' },
];

const initialProgress: AchievementProgress = {
  totalWins: 0,
  totalHands: 0,
  royalFlushes: 0,
  straightFlushes: 0,
  fullHouses: 0,
  flushes: 0,
  straights: 0,
  threeOfAKind: 0,
  winStreak: 0,
  maxWinStreak: 0,
  busts: 0,
};

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, unlocked: false }));
  });

  const [progress, setProgress] = useState<AchievementProgress>(() => {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return initialProgress;
  });

  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (!achievement || achievement.unlocked) return prev;

      const updated = prev.map(a => 
        a.id === id 
          ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
          : a
      );

      // Show notification for newly unlocked
      const unlockedAch = updated.find(a => a.id === id);
      if (unlockedAch) {
        setNewlyUnlocked(unlockedAch);
        setTimeout(() => setNewlyUnlocked(null), 3000);
      }

      return updated;
    });
  }, []);

  const updateProgress = useCallback((id: string, value: number) => {
    setAchievements(prev => 
      prev.map(a => 
        a.id === id && a.target 
          ? { ...a, progress: Math.min(value, a.target) }
          : a
      )
    );
  }, []);

  const checkAchievements = useCallback((newProgress: AchievementProgress) => {
    // First win
    if (newProgress.totalWins >= 1) unlockAchievement('first_win');
    
    // Hand achievements
    if (newProgress.royalFlushes >= 1) unlockAchievement('royal_flush');
    if (newProgress.straightFlushes >= 1) unlockAchievement('straight_flush');
    if (newProgress.fullHouses >= 1) unlockAchievement('full_house');
    if (newProgress.flushes >= 1) unlockAchievement('flush_master');
    if (newProgress.straights >= 1) unlockAchievement('straight_shooter');
    
    // Win milestones
    if (newProgress.totalWins >= 10) unlockAchievement('win_10');
    if (newProgress.totalWins >= 50) unlockAchievement('win_50');
    if (newProgress.totalWins >= 100) unlockAchievement('win_100');
    
    // Hands played
    if (newProgress.totalHands >= 100) unlockAchievement('hands_100');
    
    // Streaks
    if (newProgress.maxWinStreak >= 3) unlockAchievement('streak_3');
    if (newProgress.maxWinStreak >= 5) unlockAchievement('streak_5');
    if (newProgress.maxWinStreak >= 10) unlockAchievement('streak_10');
    
    // Survivor
    if (newProgress.busts >= 3) unlockAchievement('survivor');

    // Update progress for milestone achievements
    updateProgress('win_10', newProgress.totalWins);
    updateProgress('win_50', newProgress.totalWins);
    updateProgress('win_100', newProgress.totalWins);
    updateProgress('hands_100', newProgress.totalHands);
    updateProgress('streak_3', newProgress.maxWinStreak);
    updateProgress('streak_5', newProgress.maxWinStreak);
    updateProgress('streak_10', newProgress.maxWinStreak);
    updateProgress('survivor', newProgress.busts);
  }, [unlockAchievement, updateProgress]);

  const recordResult = useCallback((
    isWin: boolean,
    isBust: boolean,
    handRank?: HandRank,
    credits?: number
  ) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      newProgress.totalHands++;

      if (isWin) {
        newProgress.totalWins++;
        newProgress.winStreak++;
        newProgress.maxWinStreak = Math.max(newProgress.maxWinStreak, newProgress.winStreak);

        // Track hand types
        if (handRank === 'royal-flush') newProgress.royalFlushes++;
        if (handRank === 'straight-flush') newProgress.straightFlushes++;
        if (handRank === 'full-house') newProgress.fullHouses++;
        if (handRank === 'flush') newProgress.flushes++;
        if (handRank === 'straight') newProgress.straights++;
      } else {
        newProgress.winStreak = 0;
      }

      if (isBust) {
        newProgress.busts++;
      }

      // Lucky 7 check
      if (isWin && credits === 7) {
        unlockAchievement('lucky_7');
      }

      checkAchievements(newProgress);
      return newProgress;
    });
  }, [checkAchievements, unlockAchievement]);

  const resetAchievements = useCallback(() => {
    setAchievements(ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, unlocked: false })));
    setProgress(initialProgress);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  }, []);

  return {
    achievements,
    progress,
    newlyUnlocked,
    recordResult,
    resetAchievements,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length,
  };
}
