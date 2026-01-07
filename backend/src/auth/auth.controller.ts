import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto, CheckEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

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
  async login(@Body() dto: LoginDto) {
    return this.authService.validateUser(dto);
  }
}