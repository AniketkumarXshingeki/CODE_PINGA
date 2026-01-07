import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, CheckEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private config: ConfigService, private jwtService: JwtService) {}

  /**
   * STEP 1: Check if email is available
   */
  async checkEmailAvailability(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      throw new ConflictException('Email is already registered');
    }

    return { available: true, message: 'Email is available' };
  }

  /**
   * STEP 2: Finalize Registration
   */
  async registerUser(dto: RegisterDto) {
    // 1. Check for existing username (since it's unique)
    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 3. Generate Player ID (BNG-XXXXXX)
    const playerId = this.generatePlayerId();

    // 4. Create user in database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
        playerId: playerId,
        loadouts: {
        create: {
          name: 'Alpha Squad',
          gridSize: 5,
          arrangement: Array.from({ length: 25 }, (_, i) => i + 1), // [1, 2, ..., 25]
        }
      }
    } as any,
    include: { loadouts: true } // Crucial: This returns the loadout we just made
  });

    // 5. Clean up response (don't send password back)
    const { password, ...result } = user;
    return this.generateToken(result);
  }

  /**
   * LOGIN: Validate user credentials
   */
  async validateUser(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    console.log(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }


    return this.generateToken(user);
  }

  /**
   * Helper: Generate unique Alphanumeric Player ID
   */
  private generatePlayerId(): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, 6);
    return `BNG-${nanoid()}`;
  }

  //generating jwt token
  private async generateToken(user: any) {
    const payload = { 
      sub: user.playerId, 
      email: user.email, 
      username: user.username 
    };
  
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.config.get('JWT_SECRET'),
    });
  
    return { 
      access_token: token,

    };
  }
}