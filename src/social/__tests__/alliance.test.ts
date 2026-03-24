import { AllianceManager } from '../alliance';

describe('AllianceManager', () => {
  let manager: AllianceManager;

  beforeEach(() => {
    manager = new AllianceManager();
  });

  describe('createAlliance', () => {
    it('creates an alliance with the leader', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      expect(a.name).toBe('Crystal Lords');
      expect(a.leaderId).toBe('alice');
      expect(a.memberIds).toContain('alice');
      expect(a.maxMembers).toBe(20);
    });

    it('throws if player is already in an alliance', () => {
      manager.createAlliance('alice', 'Crystal Lords');
      expect(() => manager.createAlliance('alice', 'Another Alliance')).toThrow('already in an alliance');
    });
  });

  describe('joinAlliance', () => {
    it('allows a player to join', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      const updated = manager.joinAlliance('bob', a.id);
      expect(updated.memberIds).toContain('bob');
    });

    it('throws if alliance not found', () => {
      expect(() => manager.joinAlliance('bob', 'nonexistent')).toThrow('not found');
    });

    it('throws if player is already in an alliance', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.joinAlliance('bob', a.id);
      expect(() => manager.joinAlliance('bob', a.id)).toThrow('already in an alliance');
    });

    it('throws if alliance is full', () => {
      const a = manager.createAlliance('leader', 'Full Guild');
      for (let i = 0; i < 19; i++) {
        manager.joinAlliance(`player${i}`, a.id);
      }
      expect(() => manager.joinAlliance('overflow', a.id)).toThrow('full');
    });
  });

  describe('leaveAlliance', () => {
    it('removes player from alliance', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.joinAlliance('bob', a.id);
      manager.leaveAlliance('bob');
      const updatedAlliance = manager.getAlliance(a.id);
      expect(updatedAlliance!.memberIds).not.toContain('bob');
    });

    it('promotes next member if leader leaves', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.joinAlliance('bob', a.id);
      manager.leaveAlliance('alice');
      const updatedAlliance = manager.getAlliance(a.id);
      expect(updatedAlliance!.leaderId).toBe('bob');
    });

    it('disbands if last member leaves', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.leaveAlliance('alice');
      expect(manager.getAlliance(a.id)).toBeUndefined();
    });

    it('does nothing if player is not in an alliance', () => {
      expect(() => manager.leaveAlliance('unknown')).not.toThrow();
    });
  });

  describe('disbandAlliance', () => {
    it('disbands alliance if leader calls it', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.joinAlliance('bob', a.id);
      manager.disbandAlliance('alice');
      expect(manager.getAlliance(a.id)).toBeUndefined();
      expect(manager.getPlayerAlliance('bob')).toBeUndefined();
    });

    it('throws if non-leader tries to disband', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      manager.joinAlliance('bob', a.id);
      expect(() => manager.disbandAlliance('bob')).toThrow('Only the alliance leader');
    });

    it('throws if player is not in an alliance', () => {
      expect(() => manager.disbandAlliance('unknown')).toThrow();
    });
  });

  describe('getPlayerAlliance', () => {
    it('returns undefined for player not in alliance', () => {
      expect(manager.getPlayerAlliance('alice')).toBeUndefined();
    });

    it('returns the alliance the player is in', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      const found = manager.getPlayerAlliance('alice');
      expect(found).toBeDefined();
      expect(found!.id).toBe(a.id);
    });
  });

  describe('getAlliance', () => {
    it('returns undefined for nonexistent alliance', () => {
      expect(manager.getAlliance('nonexistent')).toBeUndefined();
    });

    it('returns the alliance by ID', () => {
      const a = manager.createAlliance('alice', 'Crystal Lords');
      expect(manager.getAlliance(a.id)).toBeDefined();
    });
  });
});
