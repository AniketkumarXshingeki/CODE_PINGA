import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor( private readonly configService: ConfigService) {

    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the environment variables.');
    }

    super({
      // 1. Tell the strategy where to find the token
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>  request?.cookies?.jwt]),
      
      // 2. Ensure we don't accept expired tokens
      ignoreExpiration: false,
      
      // 3. Use the same secret used during signAsync
      secretOrKey: secret,
    });
  }

  /**
   * This method is called automatically after the JWT is successfully verified.
   * The 'payload' is the decoded object containing { sub, username, email }.
   */
  async validate(payload: any) {
    // Check if the payload exists (safety check)
    console.log('JWT payload:', payload);
    if (!payload) {
      throw new UnauthorizedException();
    }

    // We return an object that NestJS will attach to 'req.user'
    // We map 'sub' back to 'playerId' so your controllers stay clean
    return { 
      playerId: payload.sub, 
      username: payload.username,
    };
  }
}