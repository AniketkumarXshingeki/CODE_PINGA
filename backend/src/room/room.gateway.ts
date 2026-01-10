import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './room.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly roomsService: RoomsService) {}
  // Track users in memory for the lobby list
  private activeRooms = new Map<
    string,
    {
      participants: {
        socketId: string;
        userId: string;
        username: string;
        isReady: boolean;
      }[];
      hostId: string;
      gameType: string | null;
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

  @SubscribeMessage('startGame')
  handleStart(client: Socket, roomCode: string) {
    // Notify all clients to move to the game screen
    this.server.to(roomCode).emit('matchStarted');
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
