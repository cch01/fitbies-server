import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/session/session.module';
import { UserModel } from './user.model';
import { UserService } from './user.service';
import { PubSubModule } from 'src/pub.sub/pub.sub.module';
import { UserMutationsResolver } from './resolvers/user.mutations.resolver';
import { UserQueriesResolver } from './resolvers/user.queries.resolver';
import { UserSubscriptionsResolver } from './resolvers/user.subscription.resolver';

@Module({
  imports: [UserModel, SessionModule, PubSubModule],
  providers: [
    UserService,
    UserMutationsResolver,
    UserQueriesResolver,
    UserSubscriptionsResolver,
  ],
  exports: [UserModel, UserService],
})
export class UserModule {}
