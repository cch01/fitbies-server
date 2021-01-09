import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/session/session.module';
import { UserModel } from './user.model';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PubSubModule } from 'src/pub.sub/pub.sub.module';

@Module({
  imports: [UserModel, SessionModule, PubSubModule],
  providers: [UserService, UserResolver],
  exports: [UserModel, UserService],
})
export class UserModule {}
