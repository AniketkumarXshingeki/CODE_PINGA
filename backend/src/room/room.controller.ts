import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth-guard';
import { RoomsService } from './room.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  async create(@Req() req) {
    // Uses req.user.playerId from your JWT Strategy
    return this.roomsService.createRoom(req.user.playerId);
  }

  @Post('join')
  async join(@Body('roomCode') roomCode: string) {
    // Validates the room exists before the frontend connects to Socket
    return this.roomsService.findRoomByCode(roomCode);
  }

  @Get(':code')
  async getRoom(@Param('code') code: string) {
    return this.roomsService.findRoomByCode(code);
  }
}