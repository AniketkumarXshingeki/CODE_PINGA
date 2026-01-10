import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';

@Module({
  providers: [GameGateway, GameService],
  controllers: [GameController],
})
export class GameModule {}
