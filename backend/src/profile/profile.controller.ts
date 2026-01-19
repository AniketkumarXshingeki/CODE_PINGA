import { Controller, Get, Param, ParseIntPipe, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth-guard';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {

    constructor(private profileService: ProfileService) {}

@Get('loadout')
@UseGuards(JwtAuthGuard) // This triggers the JwtStrategy above
  async getMyLoadouts(@Req() req) {
    const playerId = req.user.playerId; 
  
  if (!playerId) {
    throw new UnauthorizedException('No Player ID found in token');
  }
    // req.user.sub is the playerId extracted from your JWT Strategy
    return this.profileService.getUserLoadouts(playerId);
  }

// 1. History List Endpoint (Last 10 Games)
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getRecentMatches(@Req() req, @Query('page', ParseIntPipe) page: number = 0) {
    const playerId = req.user.playerId;
    if (!playerId) throw new UnauthorizedException('No Player ID found');
    
    return this.profileService.getRecentMatches(playerId,page);
  }

  // 2. History Detail Endpoint (Specific Replay)
  // Note: We don't necessarily need the user ID here unless you want to restrict access
  // to only participants. For now, it's open to authenticated users.
  @Get('history/:id')
  @UseGuards(JwtAuthGuard)
  async getMatchDetail(@Param('id') sessionId: string) {
    return this.profileService.getMatchReplay(sessionId);
  }
}
