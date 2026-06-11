export interface Player {
  id: string; // Socket ID
  name: string;
  seatNumber: number; // 1 to 6
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  status: 'lobby' | 'playing';
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  // Helper to generate a unique 6-digit room code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  // Create a new room in memory (pre-socket binding)
  public createRoom(): Room {
    const code = this.generateRoomCode();
    const newRoom: Room = {
      code,
      hostId: '',
      players: [],
      status: 'lobby',
    };
    this.rooms.set(code, newRoom);
    return newRoom;
  }

  // Get a room by its code
  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  // Check if a player name is unique in a room
  public isNameUnique(room: Room, name: string): boolean {
    return !room.players.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Join an existing room via Socket connection
  public joinRoom(
    code: string,
    playerName: string,
    playerSocketId: string
  ): { room: Room; player: Player } {
    const upperCode = code.toUpperCase();
    const room = this.rooms.get(upperCode);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === 'playing') {
      throw new Error('Game has already started');
    }

    // Check if player is already in the room (by socket ID)
    const existingPlayer = room.players.find((p) => p.id === playerSocketId);
    if (existingPlayer) {
      return { room, player: existingPlayer };
    }

    if (room.players.length >= 6) {
      throw new Error('Room is full (max 6 players)');
    }

    if (!this.isNameUnique(room, playerName)) {
      throw new Error('Display name is already taken in this room');
    }

    // Stable Seating System: Find the lowest vacant seat number between 1 and 6
    const occupiedSeats = new Set(room.players.map((p) => p.seatNumber));
    let seatNumber = 1;
    for (let i = 1; i <= 6; i++) {
      if (!occupiedSeats.has(i)) {
        seatNumber = i;
        break;
      }
    }

    // If this is the first player joining, they are the host
    const isHost = room.players.length === 0;
    if (isHost) {
      room.hostId = playerSocketId;
    }

    const newPlayer: Player = {
      id: playerSocketId,
      name: playerName,
      seatNumber,
      isHost,
    };

    room.players.push(newPlayer);
    
    // Sort players by seat number so client lists remain aligned
    room.players.sort((a, b) => a.seatNumber - b.seatNumber);

    return { room, player: newPlayer };
  }

  // Remove player from whatever room they are in
  public leaveRoom(playerSocketId: string): { room: Room | null; leftPlayer: Player } | null {
    for (const [code, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === playerSocketId);
      
      if (playerIndex !== -1) {
        const [leftPlayer] = room.players.splice(playerIndex, 1);

        // If the player was the host and there are other players, elect a new host
        if (leftPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].id;
        }

        // If room is empty, delete it
        if (room.players.length === 0) {
          this.rooms.delete(code);
          return { room: null, leftPlayer };
        }

        // Keep players sorted by seat number
        room.players.sort((a, b) => a.seatNumber - b.seatNumber);

        return { room, leftPlayer };
      }
    }
    return null;
  }

  // Set room game status to playing
  public startGame(code: string, hostSocketId: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.hostId !== hostSocketId) {
      throw new Error('Only the host can start the game');
    }
    if (room.players.length < 2) {
      throw new Error('At least 2 players are required to start the game');
    }

    room.status = 'playing';
    return room;
  }
}

export const roomManager = new RoomManager();
