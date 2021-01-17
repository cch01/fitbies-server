import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, ID } from '@nestjs/graphql';
import { ForbiddenError, UserInputError } from 'apollo-server-express';
import { SessionHandler } from 'src/guards/session.handler';
import { ActivatedUserGuard } from 'src/guards/activated.user.guard';
import { User } from 'src/modules/user/user.model';
import { UserService } from 'src/modules/user/user.service';
import {
  BlockUserInput,
  CreateMeetingInput,
  InviteMeetingInput,
  JoinMeetingInput,
  SendMeetingMessageInput,
} from '../dto/meeting.input';
import { Meeting } from '../meeting.model';
import { MeetingService } from '../meeting.service';
import { GeneralUserGuard } from 'src/guards/general.user.guard';
import { MeetingMessage } from '../dto/meeting.payload';
import { CurrentUser } from 'src/decorators/user.decorator';

@Resolver()
@UseGuards(SessionHandler)
export class MeetingMutationsResolver {
  constructor(
    private readonly userService: UserService,
    private readonly meetingService: MeetingService,
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
}
