export interface FriendRequest {
  fromId: string;
  toId: string;
  sentAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface FriendsList {
  playerId: string;
  friends: string[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}

export class FriendsManager {
  private storage: Map<string, FriendsList> = new Map();

  private getOrCreate(playerId: string): FriendsList {
    if (!this.storage.has(playerId)) {
      this.storage.set(playerId, {
        playerId,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
      });
    }
    return this.storage.get(playerId)!;
  }

  sendRequest(fromId: string, toId: string): void {
    if (fromId === toId) {
      throw new Error('Cannot send a friend request to yourself');
    }
    const fromList = this.getOrCreate(fromId);
    const toList = this.getOrCreate(toId);
    if (fromList.friends.includes(toId)) {
      throw new Error(`Players ${fromId} and ${toId} are already friends`);
    }
    const existingOutgoing = fromList.outgoingRequests.find(
      r => r.toId === toId && r.status === 'PENDING'
    );
    if (existingOutgoing) {
      throw new Error(`Friend request from ${fromId} to ${toId} already pending`);
    }
    const request: FriendRequest = {
      fromId,
      toId,
      sentAt: new Date(),
      status: 'PENDING',
    };
    fromList.outgoingRequests.push(request);
    toList.incomingRequests.push(request);
  }

  acceptRequest(playerId: string, fromId: string): void {
    const playerList = this.getOrCreate(playerId);
    const req = playerList.incomingRequests.find(
      r => r.fromId === fromId && r.status === 'PENDING'
    );
    if (!req) {
      throw new Error(`No pending friend request from ${fromId} to ${playerId}`);
    }
    req.status = 'ACCEPTED';
    playerList.friends.push(fromId);
    const fromList = this.getOrCreate(fromId);
    fromList.friends.push(playerId);
  }

  rejectRequest(playerId: string, fromId: string): void {
    const playerList = this.getOrCreate(playerId);
    const req = playerList.incomingRequests.find(
      r => r.fromId === fromId && r.status === 'PENDING'
    );
    if (!req) {
      throw new Error(`No pending friend request from ${fromId} to ${playerId}`);
    }
    req.status = 'REJECTED';
  }

  removeFriend(playerId: string, friendId: string): void {
    const playerList = this.getOrCreate(playerId);
    const friendList = this.getOrCreate(friendId);
    playerList.friends = playerList.friends.filter(id => id !== friendId);
    friendList.friends = friendList.friends.filter(id => id !== playerId);
  }

  getFriends(playerId: string): string[] {
    return this.getOrCreate(playerId).friends;
  }

  areFriends(playerA: string, playerB: string): boolean {
    return this.getOrCreate(playerA).friends.includes(playerB);
  }

  getPendingRequests(playerId: string): FriendRequest[] {
    return this.getOrCreate(playerId).incomingRequests.filter(
      r => r.status === 'PENDING'
    );
  }
}
