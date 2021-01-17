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
  BlockUserInput,
  CreateMeetingInput,
  InviteMeetingInput,
  JoinMeetingInput,
  SendMeetingMessageInput,
} from './dto/meeting.input';
import { Meeting, MeetingConnection, MeetingDocument } from './meeting.model';
import { MeetingService } from './meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { MeetingEventsPayload, MeetingMessage } from './dto/meeting.payload';
import { withUnsubscribe } from 'src/utils/withUnsubscribe';

@Resolver((of) => Meeting)
@UseGuards(SessionHandler)
export class MeetingResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
    @InjectModel('meeting')
    private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel('user') private readonly userModel: Model<UserDocument>,
    @Inject('pubSub') private readonly pubSub: PubSubEngine,
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
  @UseGuards(GeneralUserGuard)
  async joinMeeting(
    @Args('joinMeetingInput') joinMeetingInput: JoinMeetingInput,
    @CurrentUser() currentUser: User,
  ) {
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      joinMeetingInput.joinerId,
    );
    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }
    const joinedResult = await this.meetingService.joinMeeting(
      joinMeetingInput,
      currentUser,
    );

    return joinedResult;
  }

  @Mutation((returns) => Meeting, { nullable: true })
  @UseGuards(ActivatedUserGuard)
  async endMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const isPermitToWriteUser = await this.userService.isPermitToWriteUser(
      currentUser,
      userId,
    );
    if (!isPermitToWriteUser) {
      throw new ForbiddenError('Access denied');
    }

    return await this.meetingService.endMeeting(meetingId, userId, currentUser);
  }

  @Mutation((returns) => Meeting)
  @UseGuards(GeneralUserGuard)
  async leaveMeeting(
    @Args('meetingId', { type: () => ID }) meetingId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ) {
    if (!(await this.userService.isPermitToWriteUser(currentUser, userId))) {
      throw new ForbiddenError('Access denied');
    }
    return await this.meetingService.leaveMeeting(
      meetingId,
      userId,
      currentUser,
    );
  }

  @Mutation((returns) => Meeting)
  @UseGuards(ActivatedUserGuard)
  async blockMeetingUser(
    @Args('blockUserInput')
    blockUserInput: BlockUserInput,
    @CurrentUser() currentUser: User,
  ) {
    return await this.meetingService.blockMeetingUser(
      blockUserInput,
      currentUser,
    );
  }

  @Mutation((returns) => Meeting)
  @UseGuards(ActivatedUserGuard)
  async unblockMeetingUser(
    @Args('blockUserInput')
    blockUserInput: BlockUserInput,
    @CurrentUser() currentUser: User,
  ) {
    return await this.meetingService.unblockMeetingUser(
      blockUserInput,
      currentUser,
    );
  }

  @Mutation((returns) => MeetingMessage)
  @UseGuards(GeneralUserGuard)
  async sendMeetingMessage(
    @Args('sendMeetingMessageInput') input: SendMeetingMessageInput,
    @CurrentUser() currentUser: User,
  ): Promise<MeetingMessage> {
    const { userId } = input;
    if (!(await this.userService.isPermitToWriteUser(currentUser, userId))) {
      throw new ForbiddenError('Access denied');
    }
    return await this.meetingService.sendMeetingMessage(input, currentUser);
  }

  @Mutation((returns) => Meeting)
  @UseGuards(ActivatedUserGuard)
  async inviteMeeting(
    @Args('inviteMeetingInput')
    { meetingId, email, userId }: InviteMeetingInput,
    @CurrentUser() currentUser: User,
  ) {
    if (!(email || userId)) {
      throw new UserInputError('At least email or userId must be specified');
    }
    return await this.meetingService.inviteUserToMeeting(
      { meetingId, email, userId },
      currentUser,
    );
  }

  @Query((returns) => Meeting, { nullable: true })
  @UseGuards(GeneralUserGuard)
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
    if (!initiatorId && !isPermitToReadUser) {
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
    return withUnsubscribe(
      this.pubSub.asyncIterator('meetingChannel'),
      async () => {
        console.log(`${currentUser.nickname} leaved`);
        await this.leaveMeeting(meetingId, userId, currentUser);
      },
    );
  }

  @ResolveField((returns) => String)
  @UseGuards(ActivatedUserGuard)
  async passCode(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      meeting.initiator,
    );

    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return meeting.passCode;
  }

  @ResolveField((returns) => String)
  @UseGuards(GeneralUserGuard)
  async initiator(@Parent() meeting: Meeting): Promise<User> {
    return this.userModel.findById(meeting.initiator);
  }

  @ResolveField((returns) => String)
  @UseGuards(ActivatedUserGuard)
  async blockList(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string[]> {
    const isPermitToReadUser = await this.userService.isPermitToReadUser(
      currentUser,
      meeting.initiator,
    );

    if (!isPermitToReadUser) {
      throw new ForbiddenError('Access denied');
    }
    return meeting.blockList;
  }

  @ResolveField((returns) => String)
  @UseGuards(GeneralUserGuard)
  async roomId(
    @Parent() meeting: Meeting,
    @CurrentUser() currentUser: User,
  ): Promise<string> {
    const isUserJoined = !!meeting.participants.find(
      (participant) =>
        participant._id.toString() === currentUser._id.toString(),
    );
    if (!isUserJoined && !this.userService.isAdmin(currentUser)) {
      throw new ForbiddenError('Access denied');
    }

    return meeting.roomId;
  }
}
