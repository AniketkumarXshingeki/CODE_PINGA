import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { RegisterDto, CheckEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt.auth-guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto) {
  
    return this.authService.checkEmailAvailability(dto.email);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const accessToken= await this.authService.registerUser(dto);
    this.attachcookie(response, accessToken);
    return { message: 'Registration successful' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response:Response) {
    const accessToken = await this.authService.validateUser(dto);
    this.attachcookie(response, accessToken);
    return { message: 'Login successful' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
  response.clearCookie('jwt');
  return { message: 'Logged out' };
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    console.log('getProfile called, req.user:', req.user);
    return req.user; 
  }

private attachcookie(response: Response, token: { access_token: string }) {
    response.cookie('jwt', token.access_token, {
    httpOnly: true, // JavaScript cannot read this (prevents XSS)
    secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });
}
}