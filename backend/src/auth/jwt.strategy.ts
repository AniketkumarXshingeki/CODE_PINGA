import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // 1. Tell the strategy where to find the token
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.jwt;
          console.log('Extracting JWT from cookies:', token ? 'token present' : 'no token');
          return token;
        }
      ]),
      
      // 2. Ensure we don't accept expired tokens
      ignoreExpiration: false,
      
      // 3. Use the same secret used during signAsync
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  /**
   * This method is called automatically after the JWT is successfully verified.
   * The 'payload' is the decoded object containing { sub, username, email }.
   */
  async validate(payload: any) {
    console.log('JWT validate called, payload:', payload);
    // Check if the payload exists (safety check)
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