export interface PlayerRanking {
  playerId: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface LeaderboardEntry extends PlayerRanking {
  rank: number;
  winRate: number;
}

export function sortLeaderboard(rankings: PlayerRanking[]): LeaderboardEntry[] {
  const sorted = [...rankings].sort((a, b) => b.elo - a.elo);
  return sorted.map((r, index) => {
    const totalGames = r.wins + r.losses + r.draws;
    const winRate = totalGames > 0 ? r.wins / totalGames : 0;
    return { ...r, rank: index + 1, winRate };
  });
}

export function getRankPosition(rankings: PlayerRanking[], playerId: string): number {
  const sorted = sortLeaderboard(rankings);
  const entry = sorted.find(e => e.playerId === playerId);
  return entry ? entry.rank : -1;
}
