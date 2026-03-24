import { FriendsManager } from '../friends';
import { FriendBattleManager, FRIEND_BATTLE_VEILSTONE_REWARD } from '../friend-battle';
import { PlayerProfile } from '../../progression/player-profile';

function makeFriends(): { fm: FriendsManager; fbm: FriendBattleManager } {
  const fm = new FriendsManager();
  const fbm = new FriendBattleManager(fm);
  fm.sendRequest('alice', 'bob');
  fm.acceptRequest('bob', 'alice');
  return { fm, fbm };
}

function makeProfile(id: string): PlayerProfile {
  return {
    id,
    username: id,
    aetherShards: 0,
    heroes: [{ archetypeId: 'SHARDWARDEN', level: 1, xp: 0, bonusAtk: 0, bonusDef: 0, bonusSpd: 0 }],
  };
}

describe('FriendBattleManager', () => {
  describe('challenge', () => {
    it('creates a pending challenge between friends', () => {
      const { fbm } = makeFriends();
      const c = fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      expect(c.status).toBe('PENDING');
      expect(c.challengerId).toBe('alice');
      expect(c.challengedId).toBe('bob');
    });

    it('throws if not friends', () => {
      const fm = new FriendsManager();
      const fbm = new FriendBattleManager(fm);
      expect(() => fbm.challenge('alice', 'bob', 'SHARDWARDEN')).toThrow('not friends');
    });
  });

  describe('acceptChallenge', () => {
    it('marks challenge as accepted', () => {
      const { fbm } = makeFriends();
      const c = fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      const updated = fbm.acceptChallenge(c.id, 'AETHERSPARK');
      expect(updated.status).toBe('ACCEPTED');
    });

    it('throws if challenge not found', () => {
      const { fbm } = makeFriends();
      expect(() => fbm.acceptChallenge('nonexistent', 'SHARDWARDEN')).toThrow('not found');
    });

    it('throws if challenge not pending', () => {
      const { fbm } = makeFriends();
      const c = fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      fbm.declineChallenge(c.id);
      expect(() => fbm.acceptChallenge(c.id, 'AETHERSPARK')).toThrow('not pending');
    });
  });

  describe('declineChallenge', () => {
    it('marks challenge as declined', () => {
      const { fbm } = makeFriends();
      const c = fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      const updated = fbm.declineChallenge(c.id);
      expect(updated.status).toBe('DECLINED');
    });

    it('throws if challenge not found', () => {
      const { fbm } = makeFriends();
      expect(() => fbm.declineChallenge('nonexistent')).toThrow('not found');
    });
  });

  describe('getActiveChallenges', () => {
    it('returns pending challenges for a player', () => {
      const { fbm } = makeFriends();
      fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      expect(fbm.getActiveChallenges('alice')).toHaveLength(1);
      expect(fbm.getActiveChallenges('bob')).toHaveLength(1);
    });

    it('excludes non-pending challenges', () => {
      const { fbm } = makeFriends();
      const c = fbm.challenge('alice', 'bob', 'SHARDWARDEN');
      fbm.declineChallenge(c.id);
      expect(fbm.getActiveChallenges('alice')).toHaveLength(0);
    });
  });

  describe('awardVeilstone', () => {
    it('awards 5 veilstone to the winner', () => {
      const { fbm } = makeFriends();
      const p = makeProfile('alice');
      const result = fbm.awardVeilstone(p);
      expect(result.veilstone).toBe(FRIEND_BATTLE_VEILSTONE_REWARD);
    });

    it('does not mutate the original player', () => {
      const { fbm } = makeFriends();
      const p = makeProfile('alice');
      fbm.awardVeilstone(p);
      expect(p.veilstone).toBeUndefined();
    });
  });
});
