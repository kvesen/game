import { FriendsManager } from './friends';
import { PlayerProfile } from '../progression/player-profile';

export interface FriendBattleChallenge {
  id: string;
  challengerId: string;
  challengedId: string;
  challengerHeroId: string;
  createdAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

export interface FriendBattleResult {
  challengerId: string;
  challengedId: string;
  winner: 'challenger' | 'challenged' | 'draw';
  rounds: number;
}

export const FRIEND_BATTLE_VEILSTONE_REWARD = 5;

export class FriendBattleManager {
  private challenges: Map<string, FriendBattleChallenge> = new Map();
  private friendsManager: FriendsManager;
  private nextId = 1;

  constructor(friendsManager: FriendsManager) {
    this.friendsManager = friendsManager;
  }

  challenge(
    challengerId: string,
    challengedId: string,
    heroId: string
  ): FriendBattleChallenge {
    if (!this.friendsManager.areFriends(challengerId, challengedId)) {
      throw new Error(`${challengerId} and ${challengedId} are not friends`);
    }
    const id = `challenge_${this.nextId++}`;
    const c: FriendBattleChallenge = {
      id,
      challengerId,
      challengedId,
      challengerHeroId: heroId,
      createdAt: new Date(),
      status: 'PENDING',
    };
    this.challenges.set(id, c);
    return { ...c };
  }

  acceptChallenge(challengeId: string, heroId: string): FriendBattleChallenge {
    const c = this.challenges.get(challengeId);
    if (!c) {
      throw new Error(`Challenge '${challengeId}' not found`);
    }
    if (c.status !== 'PENDING') {
      throw new Error(`Challenge '${challengeId}' is not pending (status: ${c.status})`);
    }
    c.status = 'ACCEPTED';
    return { ...c };
  }

  declineChallenge(challengeId: string): FriendBattleChallenge {
    const c = this.challenges.get(challengeId);
    if (!c) {
      throw new Error(`Challenge '${challengeId}' not found`);
    }
    if (c.status !== 'PENDING') {
      throw new Error(`Challenge '${challengeId}' is not pending (status: ${c.status})`);
    }
    c.status = 'DECLINED';
    return { ...c };
  }

  getActiveChallenges(playerId: string): FriendBattleChallenge[] {
    return Array.from(this.challenges.values()).filter(
      c =>
        c.status === 'PENDING' &&
        (c.challengerId === playerId || c.challengedId === playerId)
    );
  }

  awardVeilstone(player: PlayerProfile): PlayerProfile {
    return {
      ...player,
      veilstone: (player.veilstone ?? 0) + FRIEND_BATTLE_VEILSTONE_REWARD,
    };
  }
}
