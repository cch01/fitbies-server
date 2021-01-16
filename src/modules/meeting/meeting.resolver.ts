import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Resolver,
  Query,
  Subscription,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApolloError,
  ForbiddenError,
  PubSubEngine,
  UserInputError,
} from 'apollo-server-express';
import { Model } from 'mongoose';
import { SessionHandler } from 'src/guards/session.handler';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { applyConnectionArgs } from 'src/utils/apply.connection.args';
import { ConnectionArgs } from '../common/dto/connection.args';
import { User, UserDocument } from '../user/user.model';
import { UserService } from '../user/user.service';
import {
  CreateMeetingInput,
  InviteMeetingInput,
  JoinMeetingInput,
} from './dto/meeting.input';
import { Meeting, MeetingConnection, MeetingDocument } from './meeting.model';
import { MeetingService } from './meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { MeetingEventsPayload, MeetingEventType } from './dto/meeting.payload';
import * as _ from 'lodash';
import { UserChannelEventType } from '../user/dto/user.payload';

//TODO add pubsub dispatching on meeting resolvers / services
@Resolver((of) => Meeting)
@UseGuards(SessionHandler)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
    @Inject('PUB_SUB') private readonly pubSub: PubSubEngine,
  ) {}

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async createMeeting(
    @Args('createMeetingInput') createMeetingInput: CreateMeetingInput,
    @CurrentUser() currentUser: User,
  ): Promise<Meeting> {
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      createMeetingInput.initiatorId,
    );
    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    return this.meetingService.createMeeting(createMeetingInput);
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async joinMeeting(
    @Args('joinMeetingInput') joinMeetingInput: JoinMeetingInput,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser._id.toString() != joinMeetingInput.joinerId) {
      throw new ForbiddenError('Access denied');
    }
    const joinedResult = await this.meetingService.joinMeeting(
      joinMeetingInput,
    );
    const meetingEventsPayload = await this.meetingService.createMeetingEventsPayload(
      MeetingEventType.USER_JOINED,
      currentUser,
      joinedResult,
    );
    this.pubSub.publish('meetingChannel', {
      meetingChannel: meetingEventsPayload,
    });

    return joinedResult;
  }

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async endMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.meetingService.endMeeting(meetingId, currentUser);
    const meetingEventsPayload = await this.meetingService.createMeetingEventsPayload(
      MeetingEventType.END_MEETING,
      currentUser,
      result,
    );
    this.pubSub.publish('meetingChannel', {
      meetingChannel: meetingEventsPayload,
    });
    return result;
  }

  @Mutation((returns) => Meeting, { nullable: true })
  async leaveMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.meetingService.leaveMeeting(
      meetingId,
      currentUser._id,
    );
    const meetingEventsPayload = await this.meetingService.createMeetingEventsPayload(
      MeetingEventType.LEAVE_MEETING,
      currentUser,
      result,
    );
    this.pubSub.publish('meetingChannel', {
      meetingChannel: meetingEventsPayload,
    });
    return result;
  }

  @Mutation((returns) => Meeting)
  async inviteMeeting(
    @Args('inviteMeetingInput')
    { meetingId, email, userId }: InviteMeetingInput,
    @CurrentUser() currentUser: User,
  ) {
    //TODO: fix this checking
    if (!(meetingId || userId)) {
      throw new UserInputError(
        'At least meetingId or userId must be specified',
      );
    }
    const result = await this.meetingService.inviteMeetingChecking(
      { meetingId, email, userId },
      currentUser,
    );

    email &&
      this.meetingService.inviteMeetingByEmail(
        email,
        currentUser.nickname,
        meetingId,
      );

    if (userId) {
      const meetingEventsPayload = this.userService.createUserChannelPayload(
        result.targetUser,
        UserChannelEventType.MEETING_INVITATION,
        undefined,
        undefined,
        { meetingId, inviter: currentUser },
      );
      this.pubSub.publish('userChannel', { userChannel: meetingEventsPayload });
    }

    return result.targetMeeting;
  }

  @Query((returns) => Meeting, { nullable: true })
  async meeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.meetingService.meeting(meetingId, currentUser);
  }

  @Query((returns) => MeetingConnection)
  @UseGuards(ActivatedUserGuard)
  async meetings(
    @Args('connectionArgs') connectionArgs: ConnectionArgs,
    @Args('initiatorId', { type: () => ID, nullable: true })
    initiatorId: string,
    @Args('joinerId', { type: () => ID, nullable: true }) joinerId: string,
    @CurrentUser() currentUser: User,
  ) {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      initiatorId,
    );
    if ((!initiatorId && currentUser.type != 'ADMIN') || !isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return await applyConnectionArgs(connectionArgs, this.meetingModel, {
      query: {
        ...(initiatorId && { initiator: initiatorId }),
        ...(joinerId && {
          participants: { $elemMatch: { _id: joinerId } },
        }),
      },
    });
  }

  @Subscription((returns) => MeetingEventsPayload, {
    async filter(this: MeetingResolver, { meetingChannel }, input, context) {
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
    if (userId != currentUser._id) {
      throw new ForbiddenError('Access denied');
    }
    const meeting = await this.meetingModel.findById(meetingId);
    const isParticipant = meeting?.participants?.find(
      (participant) =>
        !participant.isLeft &&
        participant._id.toString() === currentUser._id.toString(),
    );
    if (!meeting || meeting.endedAt || !isParticipant) {
      throw new ApolloError('Meeting not found / has already ended');
    }

    return this.pubSub.asyncIterator('meetingChannel');
  }
  @ResolveField((returns) => String)
  async passCode(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    if (currentUser._id.toString() !== meeting.initiator.toString()) {
      throw new ForbiddenError('Access denied');
    }
    return meeting.passCode;
  }

  @ResolveField((returns) => String)
  async initiator(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    console.log(meeting);
    return this.userModel.findById(meeting.initiator);
  }

  @ResolveField((returns) => String)
  async roomId(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    const isUserJoined = !!meeting.participants.find(
      (participant) =>
        participant._id.toString() === currentUser._id.toString(),
    );
    if (!isUserJoined) {
      throw new ForbiddenError('Access denied');
    }

    return meeting.roomId;
  }

  //TODO kick
}
