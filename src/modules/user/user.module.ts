import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/session/session.module';
import { UserModel } from './user.model';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PubSub } from 'graphql-subscriptions';

@Module({
  imports: [UserModel, SessionModule],
  providers: [
    UserService,
    UserResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [UserModel, UserService],
})
export class UserModule {}
