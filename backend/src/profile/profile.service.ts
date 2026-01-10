import { Injectable } from '@nestjs/common';
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
}
