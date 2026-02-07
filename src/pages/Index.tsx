import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Hand } from '@/components/Hand';
import { TubeGauge } from '@/components/TubeGauge';
import { StatsPanel } from '@/components/StatsPanel';
import { GameControls } from '@/components/GameControls';
import { ResultOverlay } from '@/components/ResultOverlay';
import { HandRankingsPopup } from '@/components/HandRankingsPopup';
import { DailyChallenges } from '@/components/DailyChallenges';
import { cn } from '@/lib/utils';

const Index = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const game = useGameState();
  const challenges = useDailyChallenges();

  const isPlayerTurn = game.phase === 'holding';
  const showHands = game.playerHand.length > 0;
  const showResults = game.phase === 'showdown' || game.phase === 'result';

  // Track game results for challenges
  useEffect(() => {
    if (game.phase === 'result' && game.result) {
      const isWin = game.result === 'win';
      const isBust = game.result === 'bust';
      const handRank = game.playerHandResult?.rank;
      challenges.recordHandResult(isWin, isBust, handRank);
    }
  }, [game.phase, game.result, game.playerHandResult?.rank]);

  const handleClaimReward = (challengeId: string) => {
    const reward = challenges.claimReward(challengeId);
    if (reward > 0) {
      game.addCredits(reward);
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      game.result === 'bust' && 'animate-bust-flash'
    )}>
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/30">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-casino-gold tracking-wide">
            Stack Draw
          </h1>
          <div className="flex items-center gap-3">
            <HandRankingsPopup />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              5-Card Draw Poker
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 container max-w-6xl mx-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Left Sidebar - Tubes */}
          <aside className="lg:w-56 shrink-0 space-y-4">
            <TubeGauge 
              tubes={game.tubes} 
              highlightedTube={game.highlightedTube}
              isDraining={game.result === 'win'}
            />
          </aside>

          {/* Center - Game Table */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Felt Table */}
            <div className="felt-texture rounded-3xl p-6 md:p-10 w-full max-w-3xl border border-green-900/50 shadow-2xl">
              {!showHands ? (
                <div className="text-center py-16 md:py-24">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground/80 mb-2">
                    Ready to Play?
                  </h2>
                  <p className="text-muted-foreground">
                    Click Deal to start a new hand
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Dealer Hand */}
                  <Hand
                    cards={game.dealerHand}
                    heldCards={game.dealerHeldCards}
                    isRevealed={showResults}
                    disabled
                    label="Dealer"
                    handName={showResults ? game.dealerHandResult?.name : undefined}
                    isWinner={game.result === 'lose'}
                  />

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {isPlayerTurn ? 'Select cards to hold' : 'VS'}
                    </span>
                    <div className="flex-1 h-px bg-foreground/10" />
                  </div>

                  {/* Player Hand */}
                  <Hand
                    cards={game.playerHand}
                    heldCards={game.playerHeldCards}
                    isRevealed
                    onCardClick={isPlayerTurn ? game.toggleHold : undefined}
                    disabled={!isPlayerTurn}
                    label="Your Hand"
                    handName={showResults ? game.playerHandResult?.name : undefined}
                    isWinner={game.result === 'win'}
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-8">
              <GameControls
                gamePhase={game.phase}
                onDeal={game.deal}
                onDraw={game.draw}
                onNewHand={game.newHand}
                onReset={game.resetGame}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                credits={game.credits}
                ante={game.ante}
                canAffordAnte={game.canAffordAnte}
              />
            </div>
          </div>

          {/* Right Sidebar - Stats & Challenges */}
          <aside className="lg:w-56 shrink-0 space-y-4">
            <StatsPanel
              handsPlayed={game.stats.handsPlayed}
              wins={game.stats.wins}
              losses={game.stats.losses}
              busts={game.stats.busts}
              totalWagered={game.stats.totalWagered}
              totalWon={game.stats.totalWon}
            />
            <DailyChallenges
              challenges={challenges.challenges}
              currentStreak={challenges.currentStreak}
              onClaimReward={handleClaimReward}
            />
          </aside>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          <p>
            <strong>How to Play:</strong> Ante {game.ante} credits, select cards to hold, then draw. 
            Beat the dealer's hand to win. Payouts come from Stack Tubes - if a tube is empty, you bust!
          </p>
        </div>
      </main>

      {/* Result Overlay */}
      <ResultOverlay
        result={game.result}
        payout={game.payout}
        message={game.resultMessage}
      />
    </div>
  );
};

export default Index;
