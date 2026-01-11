import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './room.service';
import { GameService } from './game.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly roomsService: RoomsService, private readonly gameService: GameService) {}
  // Track users in memory for the lobby list
  private activeRooms = new Map<
    string,
    {
      participants: {
        socketId: string;
        userId: string;
        username: string;
        isReady: boolean;
        loadout?: any[];
      }[];
      hostId: string;
      gameType: string | null;
      sessionId?: string;
      turnOrder?: string[]; // Array of userIds
      activeTurnIndex?: number;
    }
  >();

  @SubscribeMessage('joinRoom')
  handleJoin(
    client: Socket,
    payload: { roomCode: string; userId: string; username: string },
  ) {
    const { roomCode, userId, username } = payload;

    client.join(roomCode);

    // Update local state
    if (!this.activeRooms.has(roomCode)) {
      this.activeRooms.set(roomCode, {
        participants: [],
        gameType: null,
        hostId: userId,
      });
    }

    const room = this.activeRooms.get(roomCode);
    if (room && !room.participants.find((p) => p.userId === userId)) {
      // Find if user already exists (e.g. on refresh) and update their socketId
      const existingPlayer = room.participants.find((p) => p.userId === userId);
      if (existingPlayer) {
        existingPlayer.socketId = client.id;
      } else {
        room.participants.push({
          socketId: client.id,
          userId,
          username,
          isReady: false,
        });
      }
      // Broadcast updated list to everyone in the room
      this.server.to(roomCode).emit('updateParticipants', room?.participants);
      this.server.to(roomCode).emit('gameTypeUpdated', room?.gameType);
      console.log('Broadcast Sent:', room);
    }
  }

  // Listener for manual "Leave" button click
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, roomCode: string) {
    await this.processDeparture(client, roomCode);
  }
  
  // Listener for tab closing/internet loss
  async handleDisconnect(client: Socket) {
    for (const [roomCode, room] of this.activeRooms.entries()) {
      const isInRoom = room.participants.some(p => p.socketId === client.id);
      if (isInRoom) {
        await this.processDeparture(client, roomCode);
        break;
      }
    }
  }

  @SubscribeMessage('setGameType')
  handleSetGameType(
    client: Socket,
    payload: { roomCode: string; gameType: string },
  ) {
    const room = this.activeRooms.get(payload.roomCode);
    console.log('SetGameType Received:', payload);
    if (room && !room.gameType) {
      room.gameType = payload.gameType;
      this.server.to(payload.roomCode).emit('gameTypeLocked', payload.gameType);
    }
  }
  
  @SubscribeMessage('toggleReady')
  handleToggleReady(
    client: Socket,
    payload: { roomCode: string; userId: string },
  ) {
    const { roomCode, userId } = payload;
    const room = this.activeRooms.get(roomCode);
    
    if (room && room.participants) {
      const player = room.participants.find((p) => p.userId === userId);
      if (player) {
        // Toggle the ready status
        player.isReady = !player.isReady;
      }
      // Broadcast the updated list with the new 'isReady' states
      this.server.to(roomCode).emit('updateParticipants', room.participants);
    }
  }
  
@SubscribeMessage('initiateStart')
handleInitiateStart(client: Socket, roomCode: string) {
  const room = this.activeRooms.get(roomCode);
  if (room && room.hostId === room.participants.find(p => p.socketId === client.id)?.userId) {
    // Tell all clients to start their 5s timer and send back their loadouts
    this.server.to(roomCode).emit('startCountdown');
  }
}

@SubscribeMessage('submitLoadout')
async handleSubmitLoadout(
  client: Socket, 
  payload: { roomCode: string; userId: string; loadout: any[] }
) {
  const room = this.activeRooms.get(payload.roomCode);
  if (!room) return;

  // 1. Find the player in the participants array and save their loadout
  const player = room.participants.find(p => p.userId === payload.userId);
  if (player) {
    player.loadout = payload.loadout;
  }

  // 2. Check if EVERY participant now has a loadout attached
  const allLoadoutsReceived = room.participants.every(p => p.loadout !== undefined);

  if (allLoadoutsReceived) {
    // 3. Use your GameService to save the session to Prisma
    // (Notice how we just pass the updated room.participants directly now)
    const gameData = await this.gameService.initializeGame(
      payload.roomCode, 
      room.participants, 
      room.gameType!
    );

    // 4. Set the session data in memory
    room.sessionId = gameData.sessionId;
    room.turnOrder = gameData.turnOrder;
    room.activeTurnIndex = 0;

    // 5. Broadcast to start the match
    this.server.to(payload.roomCode).emit('matchStarted', {
      sessionId: room.sessionId,
      turnOrder: room.turnOrder,
      activeTurnId: room.turnOrder[0]
    });
  }
}

@SubscribeMessage('callNumber')
async handleCallNumber(client: Socket, payload: { roomCode: string, number: number }) {
  const room = this.activeRooms.get(payload.roomCode);
  if (!room || room.activeTurnIndex === undefined || !room.turnOrder || !room.sessionId) return;

  const currentTurnId = room.turnOrder[room.activeTurnIndex];
  const player = room.participants.find(p => p.socketId === client.id);

  // Security: Only the active player can call a number
  if (player?.userId !== currentTurnId) return;

  // 1. Record in DB
  await this.gameService.recordNumberCalled(room.sessionId, payload.number);

  // 2. Rotate Turn
  room.activeTurnIndex = (room.activeTurnIndex + 1) % room.turnOrder.length;

  // 3. Broadcast to everyone
  this.server.to(payload.roomCode).emit('numberUpdated', {
    number: payload.number,
    nextTurnId: room.turnOrder[room.activeTurnIndex]
  });
}
  
  private async processDeparture(client: Socket, roomCode: string) {
    const room = this.activeRooms.get(roomCode);
    if (!room) return;

    const player = room.participants.find(p => p.socketId === client.id);
    if (!player) return;

    const isHost = player.userId === room.hostId;

    if (isHost) {
      // 1. Update PostgreSQL via Prisma
      try {
        await this.roomsService.closeRoom(roomCode);
        console.log(`Prisma: Room ${roomCode} set to CLOSED`);
      } catch (error) {
        console.error('Prisma Error closing room:', error);
      }

      // 2. Clear Memory & Notify Guests
      this.server.to(roomCode).emit('roomDestroyed', 'Host has closed the lobby.');
      this.activeRooms.delete(roomCode);
    } else {
      // Guest leaves: just update memory and broadcast list
      room.participants = room.participants.filter(p => p.socketId !== client.id);
      this.server.to(roomCode).emit('updateParticipants', room.participants);
    }

    client.leave(roomCode);
  }
}
