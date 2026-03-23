import { EloCalculator } from '../elo';
import { MatchmakingQueue } from '../queue';
import { sortLeaderboard, getRankPosition } from '../leaderboard';
import { PlayerRanking } from '../leaderboard';

describe('ELO Calculator', () => {
  const calc = new EloCalculator();

  it('win against equal opponent increases ELO', () => {
    const result = calc.calculateNewRatings(1000, 1000, 'WIN');
    expect(result.newPlayerElo).toBeGreaterThan(1000);
    expect(result.playerDelta).toBeGreaterThan(0);
  });

  it('loss against equal opponent decreases ELO', () => {
    const result = calc.calculateNewRatings(1000, 1000, 'LOSS');
    expect(result.newPlayerElo).toBeLessThan(1000);
    expect(result.playerDelta).toBeLessThan(0);
  });

  it('draw against equal opponent changes ELO minimally', () => {
    const result = calc.calculateNewRatings(1000, 1000, 'DRAW');
    expect(result.playerDelta).toBe(0);
    expect(result.newPlayerElo).toBe(1000);
  });

  it('win against higher rated opponent gives more ELO', () => {
    const resultVsEqual = calc.calculateNewRatings(1000, 1000, 'WIN');
    const resultVsHigher = calc.calculateNewRatings(1000, 1200, 'WIN');
    expect(resultVsHigher.playerDelta).toBeGreaterThan(resultVsEqual.playerDelta);
  });

  it('loss against lower rated opponent loses more ELO', () => {
    const resultVsEqual = calc.calculateNewRatings(1000, 1000, 'LOSS');
    const resultVsLower = calc.calculateNewRatings(1000, 800, 'LOSS');
    expect(resultVsLower.playerDelta).toBeLessThan(resultVsEqual.playerDelta);
  });

  it('ELO floor at 100', () => {
    const result = calc.calculateNewRatings(100, 3000, 'LOSS');
    expect(result.newPlayerElo).toBe(100);
  });

  it('opponent ELO changes inversely', () => {
    const result = calc.calculateNewRatings(1000, 1000, 'WIN');
    expect(result.newOpponentElo).toBeLessThan(1000);
    expect(result.opponentDelta).toBeLessThan(0);
  });
});

describe('Matchmaking Queue', () => {
  it('matches players within ELO range immediately', () => {
    const queue = new MatchmakingQueue();
    const now = new Date('2024-01-01T00:00:00Z');
    queue.join('p1', 1000, now);
    queue.join('p2', 1030, now); // within 50
    const matches = queue.findMatches(now);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ player1Id: 'p1', player2Id: 'p2' });
  });

  it('does not match players outside initial range', () => {
    const queue = new MatchmakingQueue();
    const now = new Date('2024-01-01T00:00:00Z');
    queue.join('p1', 1000, now);
    queue.join('p2', 1100, now); // 100 apart, initial range is 50
    const matches = queue.findMatches(now);
    expect(matches).toHaveLength(0);
  });

  it('expands range at 30 seconds', () => {
    const queue = new MatchmakingQueue();
    const joinTime = new Date('2024-01-01T00:00:00Z');
    queue.join('p1', 1000, joinTime);
    queue.join('p2', 1080, joinTime); // 80 apart - outside 50, inside 100
    const after30s = new Date(joinTime.getTime() + 31000);
    const matches = queue.findMatches(after30s);
    expect(matches).toHaveLength(1);
  });

  it('expands range at 60 seconds', () => {
    const queue = new MatchmakingQueue();
    const joinTime = new Date('2024-01-01T00:00:00Z');
    queue.join('p1', 1000, joinTime);
    queue.join('p2', 1150, joinTime); // 150 apart - inside 200
    const after60s = new Date(joinTime.getTime() + 61000);
    const matches = queue.findMatches(after60s);
    expect(matches).toHaveLength(1);
  });

  it('expands range at 90 seconds', () => {
    const queue = new MatchmakingQueue();
    const joinTime = new Date('2024-01-01T00:00:00Z');
    queue.join('p1', 1000, joinTime);
    queue.join('p2', 1400, joinTime); // 400 apart - inside 500
    const after90s = new Date(joinTime.getTime() + 91000);
    const matches = queue.findMatches(after90s);
    expect(matches).toHaveLength(1);
  });

  it('removes matched players from queue', () => {
    const queue = new MatchmakingQueue();
    const now = new Date();
    queue.join('p1', 1000, now);
    queue.join('p2', 1000, now);
    queue.findMatches(now);
    expect(queue.size()).toBe(0);
  });

  it('leave removes player from queue', () => {
    const queue = new MatchmakingQueue();
    queue.join('p1', 1000);
    queue.leave('p1');
    expect(queue.size()).toBe(0);
  });
});

describe('Leaderboard', () => {
  const rankings: PlayerRanking[] = [
    { playerId: 'p1', elo: 1200, wins: 10, losses: 5, draws: 0 },
    { playerId: 'p2', elo: 1000, wins: 8, losses: 7, draws: 1 },
    { playerId: 'p3', elo: 1500, wins: 20, losses: 2, draws: 0 },
    { playerId: 'p4', elo: 800, wins: 3, losses: 12, draws: 0 },
  ];

  it('sorts by ELO descending', () => {
    const sorted = sortLeaderboard(rankings);
    expect(sorted[0].playerId).toBe('p3');
    expect(sorted[1].playerId).toBe('p1');
    expect(sorted[2].playerId).toBe('p2');
    expect(sorted[3].playerId).toBe('p4');
  });

  it('assigns correct rank positions', () => {
    const sorted = sortLeaderboard(rankings);
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(2);
    expect(sorted[2].rank).toBe(3);
    expect(sorted[3].rank).toBe(4);
  });

  it('calculates win rate correctly', () => {
    const sorted = sortLeaderboard(rankings);
    const p1Entry = sorted.find(e => e.playerId === 'p1')!;
    expect(p1Entry.winRate).toBeCloseTo(10 / 15);
  });

  it('getRankPosition returns correct rank', () => {
    expect(getRankPosition(rankings, 'p3')).toBe(1);
    expect(getRankPosition(rankings, 'p4')).toBe(4);
  });

  it('getRankPosition returns -1 for unknown player', () => {
    expect(getRankPosition(rankings, 'unknown')).toBe(-1);
  });
});
