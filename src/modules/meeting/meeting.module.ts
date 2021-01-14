import { Module } from '@nestjs/common';
import { PubSubModule } from 'src/pub.sub/pub.sub.module';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { MeetingModel } from './meeting.model';
import { MeetingResolver } from './meeting.resolver';
import { MeetingService } from './meeting.service';

@Module({
  providers: [MeetingService, MeetingResolver],
  imports: [MeetingModel, UserModule, SessionModule, PubSubModule],
  exports: [MeetingModel, MeetingService],
})
export class MeetingModule {}
