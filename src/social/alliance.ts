export interface Alliance {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
  createdAt: Date;
  maxMembers: number;
}

export class AllianceManager {
  private alliances: Map<string, Alliance> = new Map();
  private playerAlliance: Map<string, string> = new Map();
  private nextId = 1;

  createAlliance(leaderId: string, name: string): Alliance {
    if (this.playerAlliance.has(leaderId)) {
      throw new Error(`Player '${leaderId}' is already in an alliance`);
    }
    const id = `alliance_${this.nextId++}`;
    const alliance: Alliance = {
      id,
      name,
      leaderId,
      memberIds: [leaderId],
      createdAt: new Date(),
      maxMembers: 20,
    };
    this.alliances.set(id, alliance);
    this.playerAlliance.set(leaderId, id);
    return { ...alliance, memberIds: [...alliance.memberIds] };
  }

  joinAlliance(playerId: string, allianceId: string): Alliance {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) {
      throw new Error(`Alliance '${allianceId}' not found`);
    }
    if (this.playerAlliance.has(playerId)) {
      throw new Error(`Player '${playerId}' is already in an alliance`);
    }
    if (alliance.memberIds.length >= alliance.maxMembers) {
      throw new Error(`Alliance '${allianceId}' is full`);
    }
    alliance.memberIds.push(playerId);
    this.playerAlliance.set(playerId, allianceId);
    return { ...alliance, memberIds: [...alliance.memberIds] };
  }

  leaveAlliance(playerId: string): void {
    const allianceId = this.playerAlliance.get(playerId);
    if (!allianceId) {
      return;
    }
    const alliance = this.alliances.get(allianceId)!;
    alliance.memberIds = alliance.memberIds.filter(id => id !== playerId);
    this.playerAlliance.delete(playerId);

    if (alliance.memberIds.length === 0) {
      this.alliances.delete(allianceId);
      return;
    }

    if (alliance.leaderId === playerId) {
      alliance.leaderId = alliance.memberIds[0];
    }
  }

  getPlayerAlliance(playerId: string): Alliance | undefined {
    const allianceId = this.playerAlliance.get(playerId);
    if (!allianceId) return undefined;
    const a = this.alliances.get(allianceId);
    if (!a) return undefined;
    return { ...a, memberIds: [...a.memberIds] };
  }

  getAlliance(allianceId: string): Alliance | undefined {
    const a = this.alliances.get(allianceId);
    if (!a) return undefined;
    return { ...a, memberIds: [...a.memberIds] };
  }

  disbandAlliance(playerId: string): void {
    const allianceId = this.playerAlliance.get(playerId);
    if (!allianceId) {
      throw new Error(`Player '${playerId}' is not in an alliance`);
    }
    const alliance = this.alliances.get(allianceId)!;
    if (alliance.leaderId !== playerId) {
      throw new Error(`Only the alliance leader can disband the alliance`);
    }
    for (const memberId of alliance.memberIds) {
      this.playerAlliance.delete(memberId);
    }
    this.alliances.delete(allianceId);
  }
}
