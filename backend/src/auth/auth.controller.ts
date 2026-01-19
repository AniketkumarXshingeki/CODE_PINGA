import { Controller, Post, Body, Res } from '@nestjs/common';
import { RegisterDto, CheckEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto) {
  
    return this.authService.checkEmailAvailability(dto.email);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response:Response) {
    const accessToken = await this.authService.validateUser(dto);
    // Set the Cookie
    response.cookie('jwt', accessToken, {
    httpOnly: true, // JavaScript cannot read this (prevents XSS)
    secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });
    return { message: 'Login successful' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
  response.clearCookie('jwt');
  return { message: 'Logged out' };
}
}