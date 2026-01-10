import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(hostId: string) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return this.prisma.room.create({
      data: {
        roomCode,
        hostId: hostId,
        status: 'ACTIVE',
      },
    });
  }

  async findRoomByCode(roomCode: string) {
    const room = await this.prisma.room.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: { sessions: true }
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'ACTIVE') throw new BadRequestException('Room is no longer active');
    
    return room;
  }
  
  async closeRoom(roomCode: string) {
    return await this.prisma.room.update({
      where: { roomCode: roomCode },
      data: { status: 'CLOSED' },
    });
  }
}