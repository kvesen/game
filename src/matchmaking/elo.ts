export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';

export interface EloChange {
  newPlayerElo: number;
  newOpponentElo: number;
  playerDelta: number;
  opponentDelta: number;
}

export class EloCalculator {
  private readonly K = 32;
  private readonly MIN_ELO = 100;

  calculateNewRatings(playerElo: number, opponentElo: number, result: MatchResult): EloChange {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actualScore = result === 'WIN' ? 1 : result === 'LOSS' ? 0 : 0.5;

    const playerDelta = Math.round(this.K * (actualScore - expectedScore));
    const opponentDelta = Math.round(this.K * ((1 - actualScore) - (1 - expectedScore)));

    const newPlayerElo = Math.max(this.MIN_ELO, playerElo + playerDelta);
    const newOpponentElo = Math.max(this.MIN_ELO, opponentElo + opponentDelta);

    return { newPlayerElo, newOpponentElo, playerDelta, opponentDelta };
  }
}
