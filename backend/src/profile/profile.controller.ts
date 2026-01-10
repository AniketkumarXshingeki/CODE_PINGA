import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth-guard';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {

    constructor(private loadoutsService: ProfileService) {}

@Get()
@UseGuards(JwtAuthGuard) // This triggers the JwtStrategy above
  async getMyLoadouts(@Req() req) {
    const playerId = req.user.playerId; 
  
  if (!playerId) {
    throw new UnauthorizedException('No Player ID found in token');
  }
    // req.user.sub is the playerId extracted from your JWT Strategy
    return this.loadoutsService.getUserLoadouts(playerId);
  }
}
