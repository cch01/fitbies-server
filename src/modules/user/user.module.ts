import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/session/session.module';
import { UserModel } from './user.model';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [UserModel, SessionModule],
  providers: [UserService, UserResolver],
  exports: [UserModel, UserService],
})
export class UserModule {}
