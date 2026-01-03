import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
    imports: [ConfigModule.forRoot({isGlobal:true}),JwtModule.registerAsync({
   useFactory:(config:ConfigService)=>({
    secret:config.get<string>('JWT_SECRET'),
   }),
   inject:[ConfigService],
   global:true,
  })],
  controllers: [AuthController],
  providers: [AuthService,PrismaService,JwtService],
})
export class AuthModule {}
