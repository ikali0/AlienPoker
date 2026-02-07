import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  runSimulation, 
  generateReport, 
  SimulationConfig, 
  SimulationResult,
  DEFAULT_CONFIG,
  generateEconomicAnalysis,
  getAdvancedHTMetrics,
  type EconomicAnalysis,
  type AdvancedHTMetrics,
} from '@/simulation';
import { 
  Play, 
  RotateCcw, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';

interface SimulationPanelProps {
  onClose?: () => void;
}

export function SimulationPanel({ onClose }: SimulationPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [economicAnalysis, setEconomicAnalysis] = useState<EconomicAnalysis | null>(null);
  const [advancedHT, setAdvancedHT] = useState<AdvancedHTMetrics[]>([]);
  
  // Configuration state
  const [config, setConfig] = useState<Partial<SimulationConfig>>({
    roundsPerRun: 10000,
    playerCount: 4,
    ante: 5,
    initSTTube: 5,
    initFLTube: 10,
    initFHTube: 15,
    initSFTube: 20,
    initRFTube: 25,
    dealerDrawAllowed: true,
    dealerBustAllowed: true,
    dealerWinsOnSameHT: false,
    bustPenaltyMultiplier: 1,
  });

  const updateConfig = (key: keyof SimulationConfig, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const runSim = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setEconomicAnalysis(null);
    setAdvancedHT([]);

    // Run simulation in next tick to allow UI update
    setTimeout(() => {
      const simResult = runSimulation(config, {
        onProgress: (completed, total) => {
          setProgress((completed / total) * 100);
        },
        onAnalysisComplete: (analysis) => {
          setEconomicAnalysis(analysis);
        },
      });
      
      setResult(simResult);
      
      // Calculate advanced HT metrics
      const fullConfig = { ...DEFAULT_CONFIG, ...config };
      const htMetrics = getAdvancedHTMetrics(simResult.stats, fullConfig);
      setAdvancedHT(htMetrics);
      
      // Also generate economic analysis if not received via callback
      if (!economicAnalysis) {
        const analysis = generateEconomicAnalysis(simResult.stats, fullConfig);
        setEconomicAnalysis(analysis);
      }
      
      setIsRunning(false);
      setProgress(100);
    }, 10);
  }, [config]);

  const reset = () => {
    setResult(null);
    setProgress(0);
    setEconomicAnalysis(null);
    setAdvancedHT([]);
    setConfig({
      ...DEFAULT_CONFIG,
      roundsPerRun: 10000,
    });
  };

  const report = result ? generateReport(result.stats) : null;

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
      {/* Configuration Section */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Simulation Config
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Rounds</Label>
              <Input
                type="number"
                value={config.roundsPerRun}
                onChange={(e) => updateConfig('roundsPerRun', parseInt(e.target.value) || 1000)}
                className="h-8 text-sm"
                min={100}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Players</Label>
              <Input
                type="number"
                value={config.playerCount}
                onChange={(e) => updateConfig('playerCount', parseInt(e.target.value) || 4)}
                className="h-8 text-sm"
                min={1}
                max={8}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Ante</Label>
              <Input
                type="number"
                value={config.ante}
                onChange={(e) => updateConfig('ante', parseInt(e.target.value) || 5)}
                className="h-8 text-sm"
                min={1}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bust Multiplier</Label>
              <Input
                type="number"
                value={config.bustPenaltyMultiplier}
                onChange={(e) => updateConfig('bustPenaltyMultiplier', parseFloat(e.target.value) || 1)}
                className="h-8 text-sm"
                min={0}
                max={10}
                step={0.5}
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">ST Tube</Label>
              <Input
                type="number"
                value={config.initSTTube}
                onChange={(e) => updateConfig('initSTTube', parseInt(e.target.value) || 5)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">FL Tube</Label>
              <Input
                type="number"
                value={config.initFLTube}
                onChange={(e) => updateConfig('initFLTube', parseInt(e.target.value) || 10)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">FH Tube</Label>
              <Input
                type="number"
                value={config.initFHTube}
                onChange={(e) => updateConfig('initFHTube', parseInt(e.target.value) || 15)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">SF Tube</Label>
              <Input
                type="number"
                value={config.initSFTube}
                onChange={(e) => updateConfig('initSFTube', parseInt(e.target.value) || 20)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">RF Tube</Label>
              <Input
                type="number"
                value={config.initRFTube}
                onChange={(e) => updateConfig('initRFTube', parseInt(e.target.value) || 25)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Dealer Draws</Label>
              <Switch
                checked={config.dealerDrawAllowed}
                onCheckedChange={(v) => updateConfig('dealerDrawAllowed', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Dealer Busts</Label>
              <Switch
                checked={config.dealerBustAllowed}
                onCheckedChange={(v) => updateConfig('dealerBustAllowed', v)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runSim}
              disabled={isRunning}
              className="flex-1 bg-primary text-primary-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Simulation'}
            </Button>
            <Button variant="outline" onClick={reset} disabled={isRunning}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {isRunning && (
            <Progress value={progress} className="h-2" />
          )}
        </CardContent>
      </Card>

      {/* Economic Health Card */}
      {economicAnalysis && (
        <Card className="bg-card border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Economic Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* House Edge with Target Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">House Edge</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${
                    economicAnalysis.houseEdgeStatus === 'optimal' 
                      ? 'text-accent' 
                      : economicAnalysis.houseEdgeStatus === 'low'
                        ? 'text-amber-500'
                        : 'text-destructive'
                  }`}>
                    {economicAnalysis.houseEdgePercent.toFixed(2)}%
                  </span>
                  {economicAnalysis.isInTargetRange ? (
                    <Badge variant="default" className="text-[10px] bg-accent text-accent-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      IN RANGE
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {economicAnalysis.houseEdgeStatus.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute left-[30%] w-[40%] h-full bg-accent/30"
                  title="Target Range: 3% - 7%"
                />
                <div 
                  className={`absolute h-full w-1 ${
                    economicAnalysis.isInTargetRange ? 'bg-accent' : 'bg-destructive'
                  }`}
                  style={{ 
                    left: `${Math.min(Math.max(economicAnalysis.houseEdgePercent, 0), 10) * 10}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>Target: 3-7%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Volatility Index */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Volatility Index</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">
                  {economicAnalysis.volatilityIndex.toFixed(2)}
                </span>
                <Badge 
                  variant={
                    economicAnalysis.riskLevel === 'low' 
                      ? 'default' 
                      : economicAnalysis.riskLevel === 'moderate'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-[10px]"
                >
                  {economicAnalysis.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Exploit Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Exploit Detection</span>
              </div>
              <div className="flex items-center gap-2">
                {economicAnalysis.exploitCount === 0 ? (
                  <Badge variant="default" className="text-[10px] bg-accent text-accent-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    SECURE
                  </Badge>
                ) : (
                  <Badge 
                    variant={economicAnalysis.criticalExploits > 0 ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {economicAnalysis.exploitCount} ALERT{economicAnalysis.exploitCount > 1 ? 'S' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exploit Alerts Card */}
      {economicAnalysis && economicAnalysis.exploitAlerts.length > 0 && (
        <Card className="bg-card border-border border-amber-500/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              Exploit Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {economicAnalysis.exploitAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-destructive/10 border-destructive/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-primary">{alert.htId}</span>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EV:</span>
                    <span className="text-accent font-mono">+{alert.calculatedEV.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="font-mono">{alert.threshold.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exceeded by:</span>
                    <span className="text-destructive font-mono">+{alert.exceededBy.toFixed(3)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  {alert.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* HT Performance Matrix */}
      {advancedHT.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">HT Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-24">HT_ID</TableHead>
                    <TableHead className="text-xs text-right">Uses</TableHead>
                    <TableHead className="text-xs text-right">Win%</TableHead>
                    <TableHead className="text-xs text-right">Loss%</TableHead>
                    <TableHead className="text-xs text-right">Bust%</TableHead>
                    <TableHead className="text-xs text-right">EV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advancedHT.slice(0, 10).map((ht) => (
                    <TableRow 
                      key={ht.htId}
                      className={ht.isExploitable ? 'bg-amber-500/10' : ''}
                    >
                      <TableCell className="font-mono text-xs text-primary">
                        {ht.htId}
                        {ht.isExploitable && (
                          <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {ht.timesUsed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-right text-accent">
                        {(ht.winProbability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {(ht.lossProbability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-right text-destructive">
                        {(ht.bustProbability * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-xs text-right font-mono ${
                        ht.calculatedEV > 0 
                          ? ht.isExploitable ? 'text-amber-500 font-bold' : 'text-accent' 
                          : 'text-muted-foreground'
                      }`}>
                        {ht.calculatedEV >= 0 ? '+' : ''}{ht.calculatedEV.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {report && (
        <>
          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rounds</span>
                <span>{report.summary.roundsCompleted.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution Time</span>
                <span>{(result!.executionTimeMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pot per Round</span>
                <span>{config.ante! * (config.playerCount! + 1)} chips</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Player Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Inputs</span>
                <span>{report.playerStats.totalInputs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wins</span>
                <span className="text-accent">{report.playerStats.totalWins.toLocaleString()} ({report.playerStats.winRate.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Losses</span>
                <span>{report.playerStats.totalLosses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Busts</span>
                <span className="text-destructive">{report.playerStats.totalBusts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net Credits</span>
                <span className={report.playerStats.netCredits >= 0 ? 'text-accent' : 'text-destructive'}>
                  {report.playerStats.netCredits >= 0 ? '+' : ''}{report.playerStats.netCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return %</span>
                <span>{report.playerStats.returnPercent.toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">House Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>Net Profit</span>
                <span className={report.houseStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}>
                  {report.houseStats.netProfit >= 0 ? '+' : ''}{report.houseStats.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">House Edge</span>
                <span>{report.houseStats.takePercent.toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Tube Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {report.tubeStats.map(tube => (
                <div key={tube.tubeType} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{tube.tubeType}</span>
                  <div className="text-right">
                    <span className="text-primary">{tube.hitCount}</span>
                    <span className="text-muted-foreground"> hits, </span>
                    <span>{tube.totalTaken}</span>
                    <span className="text-muted-foreground"> paid</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Hand Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {report.handDistribution.slice(0, 6).map(hand => (
                <div key={hand.rank} className="flex justify-between items-center">
                  <span className="text-muted-foreground capitalize">{hand.rank.replace('-', ' ')}</span>
                  <div className="text-right">
                    <span>{hand.count.toLocaleString()}</span>
                    <span className="text-muted-foreground"> ({hand.percentage.toFixed(2)}%)</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
