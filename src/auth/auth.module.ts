import { Module } from '@nestjs/common';
import { AuthGateway } from './auth.gateway';
import { AuthService } from './auth.service';
import { User } from '../_common/database/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthGateway, AuthService],
})
export class AuthModule {}
