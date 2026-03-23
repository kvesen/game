export interface QueueEntry {
  playerId: string;
  elo: number;
  joinedAt: Date;
}

export interface MatchPair {
  player1Id: string;
  player2Id: string;
}

function getEloRange(waitMs: number): number {
  if (waitMs < 30000) return 50;
  if (waitMs < 60000) return 100;
  if (waitMs < 90000) return 200;
  return 500;
}

export class MatchmakingQueue {
  private queue: QueueEntry[] = [];

  join(playerId: string, elo: number, now: Date = new Date()): void {
    if (this.queue.find(e => e.playerId === playerId)) return;
    this.queue.push({ playerId, elo, joinedAt: now });
  }

  leave(playerId: string): void {
    this.queue = this.queue.filter(e => e.playerId !== playerId);
  }

  findMatches(now: Date = new Date()): MatchPair[] {
    const matches: MatchPair[] = [];
    const matched = new Set<string>();

    const sorted = [...this.queue].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      if (matched.has(a.playerId)) continue;

      const waitMs = now.getTime() - a.joinedAt.getTime();
      const range = getEloRange(waitMs);

      for (let j = i + 1; j < sorted.length; j++) {
        const b = sorted[j];
        if (matched.has(b.playerId)) continue;

        if (Math.abs(a.elo - b.elo) <= range) {
          matches.push({ player1Id: a.playerId, player2Id: b.playerId });
          matched.add(a.playerId);
          matched.add(b.playerId);
          break;
        }
      }
    }

    this.queue = this.queue.filter(e => !matched.has(e.playerId));
    return matches;
  }

  getQueue(): QueueEntry[] {
    return [...this.queue];
  }

  size(): number {
    return this.queue.length;
  }
}
