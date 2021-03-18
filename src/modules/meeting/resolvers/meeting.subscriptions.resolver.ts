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
import { MeetingChannelPayload } from '../dto/meeting.payload';
import { withUnsubscribe } from 'src/utils/withUnsubscribe';
import { MeetingMutationsResolver } from './meeting.mutations.resolver';

@Resolver()
@UseGuards(SessionHandler)
export class MeetingSubscriptionsResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingMutationsResolver: MeetingMutationsResolver,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
  ) {}

  async checkMeetingChannelPayload(
    { type }: MeetingChannelPayload,
    { meetingId }: { meetingId: string },
    ctx: any,
  ): Promise<boolean> {
    console.log('subscribing user', ctx.user._id);
    const meeting = await this.meetingModel.findOne({ meetingId });
    if (!meeting) return false;
    const isUserInMeeting = meeting.participants.some(
      (_p) => !_p.isLeft && _p._id.toString() === ctx.user._id.toString(),
    );
    if (!isUserInMeeting) return false;
    return true;
  }

  @Subscription((returns) => MeetingChannelPayload, {
    async filter(
      this: MeetingSubscriptionsResolver,
      { meetingChannel },
      input,
      context,
    ) {
      const shouldDispatch = await this.checkMeetingChannelPayload(
        meetingChannel,
        input,
        context,
      );

      console.log(`dispatch in ${input.meetingId}`, shouldDispatch);
      return shouldDispatch;
    },
  })
  @UseGuards(GeneralUserGuard)
  async meetingChannel(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('meetingId', { type: () => String }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    console.log('meeting subscription coming!!!!!');
    if (!(await this.userService.isPermitToReadUser(currentUser, userId))) {
      throw new ForbiddenError('Access denied');
    }
    const meeting = await this.meetingModel.findOne({
      meetingId,
      endedAt: null,
    });

    if (meeting?.endedAt) {
      throw new ApolloError('Meeting has already ended');
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
