import { Inject, UseGuards } from '@nestjs/common';
import { Args, Resolver, Subscription, ID } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApolloError,
  ForbiddenError,
  PubSubEngine,
} from 'apollo-server-express';
import { Model } from 'mongoose';
import { SessionHandler } from 'src/guards/session.handler';
import { CurrentUser } from 'src/decorators/user.decorator';
import { User } from 'src/modules/user/user.model';
import { UserService } from 'src/modules/user/user.service';
import { MeetingDocument } from '../meeting.model';
import { MeetingService } from '../meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { MeetingEventsPayload } from '../dto/meeting.payload';
import { withUnsubscribe } from 'src/utils/withUnsubscribe';
import { MeetingMutationsResolver } from './meeting.mutations.resolver';

@Resolver()
@UseGuards(SessionHandler)
export class MeetingSubscriptionsResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    private readonly meetingMutationsResolver: MeetingMutationsResolver,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
  ) {}

  @Subscription((returns) => MeetingEventsPayload, {
    async filter(
      this: MeetingSubscriptionsResolver,
      { meetingChannel },
      input,
      context,
    ) {
      const result = await this.meetingService.checkMeetingEventsPayload(
        meetingChannel,
        input,
        context,
      );

      console.log('dispatch?', result);
      return result;
    },
  })
  @UseGuards(GeneralUserGuard)
  async meetingChannel(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    if (!(await this.userService.isPermitToReadUser(currentUser, userId))) {
      throw new ForbiddenError('Access denied');
    }
    const meeting = await this.meetingModel.findById(meetingId);
    const isParticipant = meeting?.participants?.find(
      (participant) =>
        !participant.isLeft &&
        participant._id.toString() === currentUser._id.toString(),
    );
    if (meeting?.endedAt || !isParticipant) {
      throw new ApolloError('Meeting not found / has already ended');
    }
    console.log(`${currentUser._id} has subscripted meetingChannel`);
    return withUnsubscribe(
      this.pubSub.asyncIterator('meetingChannel'),
      async () => {
        console.log(`${currentUser.nickname} leaved`);
        await this.meetingMutationsResolver.leaveMeeting(
          meetingId,
          userId,
          currentUser,
        );
      },
    );
  }
}
