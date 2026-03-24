import { FriendsManager } from '../friends';

describe('FriendsManager', () => {
  let manager: FriendsManager;

  beforeEach(() => {
    manager = new FriendsManager();
  });

  describe('sendRequest', () => {
    it('creates a pending request', () => {
      manager.sendRequest('alice', 'bob');
      const pending = manager.getPendingRequests('bob');
      expect(pending).toHaveLength(1);
      expect(pending[0].fromId).toBe('alice');
      expect(pending[0].status).toBe('PENDING');
    });

    it('throws if friending yourself', () => {
      expect(() => manager.sendRequest('alice', 'alice')).toThrow('yourself');
    });

    it('throws on duplicate pending request', () => {
      manager.sendRequest('alice', 'bob');
      expect(() => manager.sendRequest('alice', 'bob')).toThrow('already pending');
    });

    it('throws if already friends', () => {
      manager.sendRequest('alice', 'bob');
      manager.acceptRequest('bob', 'alice');
      expect(() => manager.sendRequest('alice', 'bob')).toThrow('already friends');
    });
  });

  describe('acceptRequest', () => {
    it('adds both players as friends', () => {
      manager.sendRequest('alice', 'bob');
      manager.acceptRequest('bob', 'alice');
      expect(manager.areFriends('alice', 'bob')).toBe(true);
      expect(manager.areFriends('bob', 'alice')).toBe(true);
    });

    it('throws if no pending request', () => {
      expect(() => manager.acceptRequest('bob', 'alice')).toThrow('No pending friend request');
    });
  });

  describe('rejectRequest', () => {
    it('rejects a pending request', () => {
      manager.sendRequest('alice', 'bob');
      manager.rejectRequest('bob', 'alice');
      expect(manager.getPendingRequests('bob')).toHaveLength(0);
      expect(manager.areFriends('alice', 'bob')).toBe(false);
    });

    it('throws if no pending request', () => {
      expect(() => manager.rejectRequest('bob', 'alice')).toThrow('No pending friend request');
    });
  });

  describe('removeFriend', () => {
    it('removes from both lists', () => {
      manager.sendRequest('alice', 'bob');
      manager.acceptRequest('bob', 'alice');
      manager.removeFriend('alice', 'bob');
      expect(manager.areFriends('alice', 'bob')).toBe(false);
      expect(manager.areFriends('bob', 'alice')).toBe(false);
    });
  });

  describe('getFriends', () => {
    it('returns friend IDs', () => {
      manager.sendRequest('alice', 'bob');
      manager.acceptRequest('bob', 'alice');
      expect(manager.getFriends('alice')).toContain('bob');
      expect(manager.getFriends('bob')).toContain('alice');
    });

    it('returns empty array for player with no friends', () => {
      expect(manager.getFriends('alice')).toEqual([]);
    });
  });

  describe('areFriends', () => {
    it('returns false for non-friends', () => {
      expect(manager.areFriends('alice', 'bob')).toBe(false);
    });

    it('returns true for friends', () => {
      manager.sendRequest('alice', 'bob');
      manager.acceptRequest('bob', 'alice');
      expect(manager.areFriends('alice', 'bob')).toBe(true);
    });
  });

  describe('getPendingRequests', () => {
    it('returns only pending requests', () => {
      manager.sendRequest('alice', 'bob');
      manager.sendRequest('charlie', 'bob');
      manager.rejectRequest('bob', 'charlie');
      const pending = manager.getPendingRequests('bob');
      expect(pending).toHaveLength(1);
      expect(pending[0].fromId).toBe('alice');
    });
  });
});
