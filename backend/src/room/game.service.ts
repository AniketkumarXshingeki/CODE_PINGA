// game.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async initializeGame(roomCode: string, participants: any[], gameType: string) {
    const gridSize = parseInt(gameType.split('x')[0]);
    
    // 1. Determine a random turn order
    const turnOrder = participants
      .map(p => p.userId)
      .sort(() => Math.random() - 0.5);

    // 2. Create the GameSession and MatchHistory records in a Transaction
    return await this.prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.create({
        data: {
          gridSize,
          turnOrder,
          drawnNumbers: [],
        }
      });

      // Create MatchHistory for each participant
      // Note: On frontend, users should have sent their 'loadout' 
      // We'll assume the client sends the loadout during 'startGame'
      for (const p of participants) {
        await tx.matchHistory.create({
          data: {
            userId: p.userId,
            sessionId: session.id,
            loadout: p.loadout || {}, // We will pass this from the gateway
            linesCount: 0,
          }
        });
      }

      return { sessionId: session.id, turnOrder };
    });
  }

  async recordNumberCalled(sessionId: string, num: number) {
    return await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        drawnNumbers: { push: num }
      }
    });
  }
}