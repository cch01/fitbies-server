import { Module } from '@nestjs/common';
import { PubSubModule } from 'src/pub.sub/pub.sub.module';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { MeetingModel } from './meeting.model';
import { MeetingQueriesResolver } from './resolvers/meeting.queries.resolver';
import { MeetingService } from './meeting.service';
import { MeetingResolver } from './resolvers/meeting.resolver';
import { MeetingMutationsResolver } from './resolvers/meeting.mutations.resolver';
import { MeetingSubscriptionsResolver } from './resolvers/meeting.subscriptions.resolver';

@Module({
  providers: [
    MeetingService,
    MeetingQueriesResolver,
    MeetingMutationsResolver,
    MeetingSubscriptionsResolver,
    MeetingResolver,
  ],
  imports: [MeetingModel, UserModule, SessionModule, PubSubModule],
  exports: [MeetingModel, MeetingService],
})
export class MeetingModule {}
