import { Module } from '@nestjs/common';
import { RoomsController } from './room.controller';
import { RoomsService } from './room.service';
import { RoomsGateway } from './room.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service';


@Module({
  imports: [PrismaModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway,GameService],
})
export class RoomModule {}
