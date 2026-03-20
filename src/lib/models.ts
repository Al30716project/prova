/**
 * Poisson Distribution for Football Goal Prediction
 * Based on the Dixon-Coles model principles
 */

export function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export interface PredictionResult {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  btts: number;
  scoreMatrix: number[][];
  fairOdds: {
    home: number;
    draw: number;
    away: number;
  };
  signals: {
    theoretical: string | null;
    operational: string | null;
  };
}

export function calculatePoissonPrediction(
  homeLambda: number,
  awayLambda: number,
  bookmakerOdds?: { home: number; draw: number; away: number },
  maxGoals: number = 8
): PredictionResult {
  const matrix: number[][] = Array(maxGoals + 1)
    .fill(0)
    .map(() => Array(maxGoals + 1).fill(0));

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let btts = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const probH = poissonProbability(homeLambda, h);
      const probA = poissonProbability(awayLambda, a);
      const probMatch = probH * probA;

      matrix[h][a] = probMatch;

      if (h > a) homeWin += probMatch;
      else if (h === a) draw += probMatch;
      else awayWin += probMatch;

      if (h + a > 2.5) over25 += probMatch;
      if (h > 0 && a > 0) btts += probMatch;
    }
  }

  const total = homeWin + draw + awayWin;
  const pHome = homeWin / total;
  const pDraw = draw / total;
  const pAway = awayWin / total;

  const fairOdds = {
    home: 1 / pHome,
    draw: 1 / pDraw,
    away: 1 / pAway,
  };

  let theoreticalSignal = null;
  let operationalSignal = null;

  if (bookmakerOdds) {
    const edgeHome = (bookmakerOdds.home / fairOdds.home) - 1;
    const edgeDraw = (bookmakerOdds.draw / fairOdds.draw) - 1;
    const edgeAway = (bookmakerOdds.away / fairOdds.away) - 1;

    if (edgeHome > 0.05) theoreticalSignal = 'Home Win';
    else if (edgeDraw > 0.05) theoreticalSignal = 'Draw';
    else if (edgeAway > 0.05) theoreticalSignal = 'Away Win';

    // Operational requires higher threshold and "reliability" (simulated here)
    if (edgeHome > 0.08) operationalSignal = 'Home Win';
  }

  return {
    homeWin: pHome,
    draw: pDraw,
    awayWin: pAway,
    over25: over25 / total,
    under25: 1 - (over25 / total),
    btts: btts / total,
    scoreMatrix: matrix,
    fairOdds,
    signals: {
      theoretical: theoreticalSignal,
      operational: operationalSignal
    }
  };
}

/**
 * Simple Strength Rating Calculation
 * In a real app, this would use rolling averages of xG and results
 */
export function estimateLambdas(
  homeAttack: number,
  awayDefense: number,
  awayAttack: number,
  homeDefense: number,
  leagueAvgGoals: number = 1.35
) {
  // Basic calculation: Team Attack * Opponent Defense * League Avg
  // homeAttack/awayAttack are multipliers (e.g. 1.2 for 20% better than avg)
  const homeLambda = homeAttack * awayDefense * leagueAvgGoals;
  const awayLambda = awayAttack * homeDefense * leagueAvgGoals;

  return { homeLambda, awayLambda };
}
