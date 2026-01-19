import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './room.service';
import { GameService } from './game.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly roomsService: RoomsService, private readonly gameService: GameService, private readonly prisma: PrismaService) {}
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
 async handleJoin(
    client: Socket,
    payload: { roomCode: string; userId: string; username: string },
  ) {
    const { roomCode, userId, username } = payload;
    const MAX_PLAYERS = 5;

    try{
    const roomCheck = await this.prisma.room.findUnique({ where: { roomCode } });
    if (!roomCheck || roomCheck.status !== 'ACTIVE') {
      throw new Error('Room not found or inactive');
    }
    const isAlreadyInRoom = roomCheck?.participants.includes(userId);

    if (!isAlreadyInRoom){
        await this.prisma.room.update({
          where: {
            roomCode: roomCode,
            status: 'ACTIVE',
            participantCount: { lt: MAX_PLAYERS },
            NOT: { participants: { has: userId } }
          },
          data: {
            participants: { push: userId },
            participantCount: { increment: 1 }
          }
        });
      }
        client.join(roomCode);

        // Update local state
        if (!this.activeRooms.has(roomCode)) {
          this.activeRooms.set(roomCode, {
            participants: [],
            gameType: null,
            hostId: roomCheck.hostId,
          });
        }

        const room = this.activeRooms.get(roomCode);
        if (room) {
          // Find if user already exists (e.g. on refresh) and update their socketId
          const existingPlayerIndex = room.participants.findIndex((p) => p.userId === userId);
          if (existingPlayerIndex !== -1) {
            room.participants[existingPlayerIndex].socketId = client.id;
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
        }
      } catch (error) {
        client.emit('joinError', 'Unable to join room. It may be full or inactive.');
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

    await this.prisma.room.update({
      where: { roomCode: payload.roomCode },
      data: { status: 'IN_PROGRESS' }
    });
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
      activeTurnId: room.turnOrder[0],
      participants: room.participants.map(p => ({
        userId: p.userId,
        username: p.username,
      })),
    });
  }
}

@SubscribeMessage('callNumber')
async handleCallNumber(client: Socket, payload: { roomCode: string, number: number }) {

  const dbRoom = await this.prisma.room.findUnique({
    where: { roomCode: payload.roomCode },
    select: { status: true }
  });

  if (!dbRoom || dbRoom.status !== 'IN_PROGRESS') {
    client.emit('error', 'Game has not started or has already ended.');
    return;
  }
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

@SubscribeMessage('claimWin')
async handleClaimWin(client: Socket, payload: { roomCode: string, sessionId: string }) {
  const room = this.activeRooms.get(payload.roomCode);
  if (!room || room.sessionId !== payload.sessionId) return;

  const winner = room.participants.find(p => p.socketId === client.id);

  if (winner) {
    // Notify everyone in the room who won
    this.server.to(payload.roomCode).emit('matchEnded', {
      winnerId: winner.userId,
      winnerName: winner.username
    });

    // Optional: Clean up room from memory or mark as inactive
    this.activeRooms.delete(payload.roomCode);
  }
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
        try {
      // Get fresh data to ensure we filter accurately
      const currentDbRoom = await this.prisma.room.findUnique({ 
        where: { roomCode },
        select: { participants: true } 
      });

      if (currentDbRoom) {
        await this.prisma.room.update({
          where: { roomCode },
          data: {
            participants: {
              // Filters the array in DB to remove this specific user
              set: currentDbRoom.participants.filter(id => id !== player.userId)
            },
            participantCount: { decrement: 1 }
          }
        });
      }

      // Update Local Memory
      room.participants = room.participants.filter(p => p.socketId !== client.id);
      
      // Notify remaining players
      this.server.to(roomCode).emit('updateParticipants', room.participants);

    } catch (error) {
      console.error('Error updating DB on guest departure:', error);
    }
  }

    client.leave(roomCode);
  }
}
