import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth-guard';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {

    constructor(private loadoutsService: ProfileService) {}

@Get()
@UseGuards(JwtAuthGuard) // This triggers the JwtStrategy above
  async getMyLoadouts(@Req() req) {
    // req.user.sub is the playerId extracted from your JWT Strategy
    const playerId = req.user.sub; 
    return this.loadoutsService.getUserLoadouts(playerId);
  }
}
