import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma:PrismaService) {}

  async getUserLoadouts(playerId: string) {

    if (!playerId) {
    console.error("Fetch attempted without playerId");
    return [];
  }
    return this.prisma.loadout.findMany({
      where: {
        user: {
          playerId: playerId, // Filters loadouts by the owner's Player ID
        },
      },
      select: {
        id: true,
        name: true,
        gridSize: true,
        arrangement: true,
        createdAt: true,
      }
    });
  }

  async getRecentMatches(playerId: string, page: number = 0) {
    const pageSize = 10;
    const history = await this.prisma.matchHistory.findMany({
      where: { userId: playerId },
      take: pageSize, // Limit to 10
      skip: page * pageSize, // Pagination
      orderBy: { session: { createdAt: 'desc' } }, // Newest first
      include: {
        session: {
          include: {
            // We need to fetch all results to find the winner's name
            playerResults: {
              include: { user: { select: { username: true } } }
            }
          }
        }
      }
    });

    const totalCount = await this.prisma.matchHistory.count({ where: { userId: playerId } });
    const hasMore = (page + 1) * pageSize < totalCount;

    // Transform the data into a clean "Card" format
    return {
      data: history.map(record => {
      // Find the winner from the participants list
      const winner = record.session.playerResults.find(
        p => p.userId === record.session.winnerId
      );

      return {
        sessionId: record.sessionId,
        playedAt: record.session.createdAt,
        myPosition: record.position, // e.g. 1 (Winner), 2, 3
        winnerName: winner ? winner.user.username : 'Draw/Unknown',
        gridSize: record.session.gridSize // Optional: helpful for UI icons
      };
    }),hasMore
  };
  }

  // --- 2. Get Match Replay (Full Details) ---
  async getMatchReplay(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        playerResults: {
          include: {
            user: { select: { username: true } }
          }
        }
      }
    });

    if (!session) throw new NotFoundException('Match not found');

    return {
      id: session.id,
      gridSize: session.gridSize,
      drawnNumbers: session.drawnNumbers,
      winnerId: session.winnerId,
      createdAt: session.createdAt,
      participants: session.playerResults.map(p => ({
        userId: p.userId,
        username: p.user.username,
        loadout: p.loadout, // The specific board arrangement
        finalLines: p.linesCount,
        position: p.position
      }))
    };
  }
}
